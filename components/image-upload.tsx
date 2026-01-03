"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  folder: "products" | "receipts"
  userId: string
  disabled?: boolean
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  folder,
  userId,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length

    if (fileArray.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s)`)
      return
    }

    setUploading(true)

    try {
      const { uploadImages } = await import("@/lib/firebase/storage")
      const newUrls = await uploadImages(fileArray, userId, folder)
      
      onImagesChange([...images, ...newUrls])
    } catch (error: any) {
      console.error("Upload error:", error)
      alert(`Failed to upload images: ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index]
    
    // If it's a Firebase Storage URL, delete it from storage
    if (imageUrl.includes("firebasestorage.googleapis.com")) {
      try {
        const { deleteImage } = await import("@/lib/firebase/storage")
        await deleteImage(imageUrl)
      } catch (error) {
        console.error("Failed to delete image from storage:", error)
        // Continue to remove from UI even if storage delete fails
      }
    }

    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleAddUrl = () => {
    const url = prompt("Enter image URL:")
    if (url && url.trim()) {
      if (images.length >= maxImages) {
        alert(`You can only have ${maxImages} images`)
        return
      }
      onImagesChange([...images, url.trim()])
    }
  }

  return (
    <div className="space-y-2">
      <Label>Images</Label>
      <div className="space-y-2">
        {/* Image Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                  <Image
                    src={imageUrl}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Controls */}
        {!disabled && images.length < maxImages && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Images"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddUrl}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Add URL
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>
        )}

        {images.length >= maxImages && !disabled && (
          <p className="text-sm text-gray-500">
            Maximum {maxImages} images reached
          </p>
        )}

        <p className="text-xs text-gray-500">
          Upload images from your device or add image URLs. Max {maxImages} images, 5MB per file.
        </p>
      </div>
    </div>
  )
}

