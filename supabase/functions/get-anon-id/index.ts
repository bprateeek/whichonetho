import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const COOKIE_NAME = "anon_id"
const MAX_AGE = 31536000 // 1 year in seconds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse existing cookies from request
    const cookieHeader = req.headers.get("cookie") || ""
    const cookies: Record<string, string> = {}

    if (cookieHeader) {
      cookieHeader.split(";").forEach(cookie => {
        const [name, ...rest] = cookie.trim().split("=")
        if (name && rest.length > 0) {
          cookies[name] = rest.join("=")
        }
      })
    }

    let anonId = cookies[COOKIE_NAME]
    let isNewCookie = false

    // Generate new ID if not present
    if (!anonId) {
      anonId = crypto.randomUUID()
      isNewCookie = true
    }

    // Build response headers
    const headers = new Headers({
      "Content-Type": "application/json",
      ...corsHeaders,
    })

    // Set cookie if it's new
    if (isNewCookie) {
      headers.set(
        "Set-Cookie",
        `${COOKIE_NAME}=${anonId}; Max-Age=${MAX_AGE}; Path=/; Secure; HttpOnly; SameSite=Lax`
      )
    }

    return new Response(
      JSON.stringify({ anon_id: anonId }),
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Error in get-anon-id:', error)

    // Fallback: generate a new ID even on error
    const fallbackId = crypto.randomUUID()

    return new Response(
      JSON.stringify({ anon_id: fallbackId, error: 'Cookie read failed, generated new ID' }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          "Set-Cookie": `${COOKIE_NAME}=${fallbackId}; Max-Age=${MAX_AGE}; Path=/; Secure; HttpOnly; SameSite=Lax`
        }
      }
    )
  }
})
