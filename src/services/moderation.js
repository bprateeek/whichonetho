import { supabase } from './supabase'

/**
 * Custom error class for moderation rejections
 */
export class ModerationError extends Error {
  constructor(message, rejectedImage, userMessage) {
    super(message)
    this.name = 'ModerationError'
    this.rejectedImage = rejectedImage // 'A' | 'B' | 'both'
    this.userMessage = userMessage
  }
}

/**
 * Convert a File/Blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Base64 encoded string (without data URL prefix)
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Moderate and upload images via Supabase Edge Function
 * This function sends images to the server for moderation before storage.
 *
 * @param {File} imageAFile - First outfit image (already compressed)
 * @param {File} imageBFile - Second outfit image (already compressed)
 * @param {string} pollId - The poll ID for organizing files
 * @returns {Promise<{imageAUrl: string, imageBUrl: string}>}
 * @throws {ModerationError} if images are rejected
 * @throws {Error} for other failures
 */
export async function moderateAndUploadImages(imageAFile, imageBFile, pollId) {
  // Convert images to base64
  const [imageA, imageB] = await Promise.all([
    blobToBase64(imageAFile),
    blobToBase64(imageBFile),
  ])

  // Call the Edge Function
  const { data, error } = await supabase.functions.invoke('moderate-and-upload', {
    body: { imageA, imageB, pollId },
  })

  if (error) {
    console.error('Edge function invocation failed:', error)
    throw new Error('Failed to process images. Please try again.')
  }

  if (!data.success) {
    if (data.error === 'MODERATION_REJECTED') {
      throw new ModerationError(
        'MODERATION_REJECTED',
        data.rejectedImage,
        data.message || 'Image contains content that violates our community guidelines'
      )
    }
    throw new Error(data.message || 'Failed to process images')
  }

  return {
    imageAUrl: data.imageAUrl,
    imageBUrl: data.imageBUrl,
  }
}
