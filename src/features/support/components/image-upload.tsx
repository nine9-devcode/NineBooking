// Component/support/image-upload.tsx
import { Camera, X, AlertCircle } from 'lucide-react'
import { useState, useRef } from 'react'

interface ImageUploadProps {
  image: File | null
  imagePreview: string | null
  onImageChange: (file: File | null) => void
  onRemove: () => void
  error?: string
  disabled?: boolean
}

export function ImageUpload({ 
  image, 
  imagePreview, 
  onImageChange, 
  onRemove, 
  error, 
  disabled 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (file: File | null) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return
    }

    onImageChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    handleFileChange(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        ภาพหน้าจอ (ไม่บังคับ)
      </label>
      
      {!imagePreview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative"
        >
          <input
            ref={inputRef}
            type="file"
            id="image"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            disabled={disabled}
          />
          <label
            htmlFor="image"
            className={`flex flex-col items-center justify-center w-full h-48 sm:h-56 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary/40 bg-primary/10 scale-105'
                : error 
                ? 'border-destructive/40 bg-destructive/10' 
                : 'border-border bg-muted hover:border-primary/40 hover:bg-primary/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Camera className={`w-12 h-12 sm:w-14 sm:h-14 mb-3 ${
              error ? 'text-destructive' : 'text-muted-foreground'
            }`} />
            <p className="text-sm sm:text-base text-muted-foreground font-semibold">
              คลิกเพื่ออัปโหลดรูปภาพ
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, JPEG, WebP (ไม่เกิน 5MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="relative">
          <div className="w-full h-64 sm:h-80 bg-muted rounded-lg border border-border overflow-hidden">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive transition-colors shadow-lg"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
          {image && (
            <div className="mt-2 text-sm text-muted-foreground">
              {image.name} ({(image.size / 1024).toFixed(0)} KB)
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}