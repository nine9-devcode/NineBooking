import { Camera, X, AlertCircle, Plus } from 'lucide-react'
import { useState, useRef } from 'react'

interface MultiImageUploadProps {
  images: File[]
  imagePreviews: string[]
  onImagesChange: (files: File[]) => void
  onRemove: (index: number) => void
  error?: string
  disabled?: boolean
  maxImages?: number
}

export function MultiImageUpload({
  images,
  imagePreviews,
  onImagesChange,
  onRemove,
  error,
  disabled,
  maxImages = 3,
}: MultiImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canAddMore = images.length < maxImages

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const newFiles: File[] = []
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    const maxSize = 5 * 1024 * 1024

    const remaining = maxImages - images.length

    for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
      const file = fileList[i]
      if (allowedTypes.includes(file.type) && file.size <= maxSize) {
        newFiles.push(file)
      }
    }

    if (newFiles.length > 0) {
      onImagesChange([...images, ...newFiles])
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (canAddMore) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (canAddMore) {
      handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        ภาพหน้าจอ (ไม่บังคับ)
        <span className="text-muted-foreground text-xs ml-1">
          {images.length}/{maxImages} รูป
        </span>
      </label>

      {/* Image previews grid */}
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-muted rounded-lg border border-border overflow-hidden">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive transition-colors shadow-lg opacity-0 group-hover:opacity-100 sm:opacity-100"
                disabled={disabled}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 text-xs text-foreground bg-black/50 rounded px-1.5 py-0.5 truncate">
                {images[index]?.name}
              </div>
            </div>
          ))}

          {/* Add more tile */}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-8 h-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">เพิ่มรูป</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone (shown when no images) */}
      {imagePreviews.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={`flex flex-col items-center justify-center w-full h-48 sm:h-56 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary/40 bg-primary/10 scale-[1.02]'
                : error
                ? 'border-destructive/40 bg-destructive/10'
                : 'border-border bg-muted hover:border-primary/40 hover:bg-primary/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Camera className={`w-12 h-12 sm:w-14 sm:h-14 mb-3 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-sm sm:text-base text-muted-foreground font-semibold">
              คลิกเพื่ออัปโหลดรูปภาพ
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              หรือลากไฟล์มาวางที่นี่
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, JPEG, WebP (ไม่เกิน 5MB ต่อรูป, สูงสุด {maxImages} รูป)
            </p>
          </button>
        </div>
      )}

      {/* Hidden input for "add more" when images exist */}
      {imagePreviews.length > 0 && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
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
