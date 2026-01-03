import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage, isFirebaseInitialized } from "./config"

/**
 * Upload an image file to Firebase Storage
 * @param file - The image file to upload
 * @param userId - The user ID (for organizing files by user)
 * @param folder - The folder name (e.g., "products", "receipts")
 * @param fileName - Optional custom file name (defaults to timestamp + original name)
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: "products" | "receipts",
  fileName?: string
): Promise<string> {
  if (!isFirebaseInitialized() || !storage) {
    throw new Error("Firebase Storage not initialized. Please check your Firebase configuration.")
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error("Image size must be less than 5MB")
  }

  // Generate file name if not provided
  const timestamp = Date.now()
  const fileExtension = file.name.split(".").pop()
  const finalFileName = fileName || `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

  // Create storage reference
  const storageRef = ref(storage, `${folder}/${userId}/${finalFileName}`)

  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    return downloadURL
  } catch (error: any) {
    console.error("Error uploading image:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Upload multiple image files
 * @param files - Array of image files to upload
 * @param userId - The user ID
 * @param folder - The folder name
 * @returns Array of download URLs
 */
export async function uploadImages(
  files: File[],
  userId: string,
  folder: "products" | "receipts"
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, userId, folder))
  return Promise.all(uploadPromises)
}

/**
 * Delete an image from Firebase Storage
 * @param imageUrl - The download URL of the image to delete
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!isFirebaseInitialized() || !storage) {
    throw new Error("Firebase Storage not initialized")
  }

  try {
    // Extract the path from the URL
    // Firebase Storage URLs look like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(imageUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
    
    if (!pathMatch) {
      throw new Error("Invalid image URL format")
    }

    // Decode the path (Firebase encodes special characters)
    const decodedPath = decodeURIComponent(pathMatch[1])
    const storageRef = ref(storage, decodedPath)

    await deleteObject(storageRef)
  } catch (error: any) {
    console.error("Error deleting image:", error)
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Check if a URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes("firebasestorage.googleapis.com")
}

