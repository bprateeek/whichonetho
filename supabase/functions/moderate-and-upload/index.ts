import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET_NAME = 'outfit-images'

// Moderation thresholds (confidence %)
const THRESHOLDS: Record<string, number> = {
  'Explicit Nudity': 60,
  'Nudity': 70,
  'Graphic Violence': 60,
  'Violence': 70,
  'Suggestive': 80,
  'Drugs': 80,
  'Hate Symbols': 60,
}

interface ModerationResult {
  approved: boolean
  reason?: string
  confidence?: number
}

// Helper functions for AWS signature
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
}

async function hmacSha256Hex(key: ArrayBuffer, message: string): Promise<string> {
  const sig = await hmacSha256(key, message)
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const kDate = await hmacSha256(encoder.encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, 'aws4_request')
  return kSigning
}

async function checkModeration(imageBase64: string): Promise<ModerationResult> {
  const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID')
  const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY')
  const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1'

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    console.warn('AWS credentials not configured, skipping moderation')
    return { approved: true }
  }

  const service = 'rekognition'
  const host = `${service}.${AWS_REGION}.amazonaws.com`
  const endpoint = `https://${host}`
  const method = 'POST'
  const amzTarget = 'RekognitionService.DetectModerationLabels'

  const requestBody = JSON.stringify({
    Image: { Bytes: imageBase64 },
    MinConfidence: 50
  })

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const canonicalUri = '/'
  const canonicalQuerystring = ''
  const canonicalHeaders = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${amzTarget}\n`
  const signedHeaders = 'content-type;host;x-amz-date;x-amz-target'

  const payloadHash = await sha256(requestBody)
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`
  const canonicalRequestHash = await sha256(canonicalRequest)
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  const signingKey = await getSignatureKey(AWS_SECRET_ACCESS_KEY, dateStamp, AWS_REGION, service)
  const signature = await hmacSha256Hex(signingKey, stringToSign)

  const authorizationHeader = `${algorithm} Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  try {
    console.log('Calling AWS Rekognition...')
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Date': amzDate,
        'X-Amz-Target': amzTarget,
        'Authorization': authorizationHeader,
      },
      body: requestBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Rekognition API error:', response.status, errorText)
      // On API error, allow the image (fail open)
      return { approved: true }
    }

    const result = await response.json()
    const labels = result.ModerationLabels || []
    console.log('Moderation labels:', JSON.stringify(labels))

    for (const label of labels) {
      const threshold = THRESHOLDS[label.Name] || THRESHOLDS[label.ParentName]
      if (threshold && label.Confidence >= threshold) {
        console.log(`Image rejected: ${label.Name} (${label.Confidence}%)`)
        return {
          approved: false,
          reason: label.ParentName || label.Name,
          confidence: label.Confidence
        }
      }
    }

    return { approved: true }
  } catch (error) {
    console.error('Moderation check failed:', error)
    return { approved: true }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge function called')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'CONFIG_ERROR', message: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let body
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { imageA, imageB, pollId } = body

    if (!imageA || !imageB || !pollId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing poll ${pollId}`)

    // Moderate both images
    const [moderationA, moderationB] = await Promise.all([
      checkModeration(imageA),
      checkModeration(imageB),
    ])

    if (!moderationA.approved || !moderationB.approved) {
      let rejectedImage: 'A' | 'B' | 'both'
      if (!moderationA.approved && !moderationB.approved) {
        rejectedImage = 'both'
      } else if (!moderationA.approved) {
        rejectedImage = 'A'
      } else {
        rejectedImage = 'B'
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'MODERATION_REJECTED',
          rejectedImage,
          message: 'Image contains content that violates our community guidelines',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload approved images
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const timestamp = Date.now()

    const imageABytes = Uint8Array.from(atob(imageA), c => c.charCodeAt(0))
    const imageBBytes = Uint8Array.from(atob(imageB), c => c.charCodeAt(0))

    const [resultA, resultB] = await Promise.all([
      supabase.storage.from(BUCKET_NAME).upload(`${pollId}/image_a_${timestamp}.jpg`, imageABytes, { contentType: 'image/jpeg' }),
      supabase.storage.from(BUCKET_NAME).upload(`${pollId}/image_b_${timestamp}.jpg`, imageBBytes, { contentType: 'image/jpeg' }),
    ])

    if (resultA.error) {
      return new Response(
        JSON.stringify({ success: false, error: 'UPLOAD_ERROR', message: `Image A: ${resultA.error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (resultB.error) {
      return new Response(
        JSON.stringify({ success: false, error: 'UPLOAD_ERROR', message: `Image B: ${resultB.error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: urlDataA } = supabase.storage.from(BUCKET_NAME).getPublicUrl(resultA.data.path)
    const { data: urlDataB } = supabase.storage.from(BUCKET_NAME).getPublicUrl(resultB.data.path)

    console.log('Upload successful!')

    return new Response(
      JSON.stringify({
        success: true,
        imageAUrl: urlDataA.publicUrl,
        imageBUrl: urlDataB.publicUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'INTERNAL_ERROR', message: error.message || 'Failed to process images' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
