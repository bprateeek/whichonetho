import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

const BUCKET_NAME = 'outfit-images'

/**
 * Compress an image file to reduce size before upload
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - Compressed image file
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg',
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Image compression failed:', error)
    // Return original file if compression fails
    return file
  }
}

/**
 * Upload an image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} pollId - The poll ID (used for folder organization)
 * @param {'a' | 'b'} slot - Which image slot (A or B)
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
export async function uploadImage(file, pollId, slot) {
  const timestamp = Date.now()
  const fileExt = 'jpg' // We convert to JPEG during compression
  const fileName = `${pollId}/image_${slot}_${timestamp}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Upload both poll images (compresses and uploads)
 * @param {File} imageAFile - First outfit image
 * @param {File} imageBFile - Second outfit image
 * @param {string} pollId - The poll ID
 * @returns {Promise<{imageAUrl: string, imageBUrl: string}>}
 */
export async function uploadPollImages(imageAFile, imageBFile, pollId) {
  // Compress both images in parallel
  const [compressedA, compressedB] = await Promise.all([
    compressImage(imageAFile),
    compressImage(imageBFile),
  ])

  // Upload both images in parallel
  const [imageAUrl, imageBUrl] = await Promise.all([
    uploadImage(compressedA, pollId, 'a'),
    uploadImage(compressedB, pollId, 'b'),
  ])

  return { imageAUrl, imageBUrl }
}

/**
 * Delete images for a poll (cleanup on failure)
 * @param {string} pollId - The poll ID
 */
export async function deleteImages(pollId) {
  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(pollId)

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${pollId}/${file.name}`)
    await supabase.storage.from(BUCKET_NAME).remove(filePaths)
  }
}
