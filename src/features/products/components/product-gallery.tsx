"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Package, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
  mainImage: string | null
  images: string[]
  productName: string
}

export function ProductGallery({
  mainImage,
  images,
  productName,
}: ProductGalleryProps) {
  // รวมรูปทั้งหมด (main + gallery)
  const allImages = mainImage ? [mainImage, ...images] : images
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // hook ทุกตัวต้องถูกเรียกก่อน early return เสมอ
  // ไม่งั้นลำดับ hook จะเปลี่ยนเมื่อสินค้าเปลี่ยนจากไม่มีรูปเป็นมีรูป แล้ว React จะพัง
  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  // ปุ่มลูกศรและ Escape ใช้ได้ตอนเปิดดูรูปเต็มจอ
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious()
      else if (e.key === "ArrowRight") goToNext()
      else if (e.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, goToNext, goToPrevious])

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
        <Package className="w-20 h-20 text-muted-foreground" />
      </div>
    )
  }

  const selectedImage = allImages[selectedIndex]

  return (
    <>
      <div className="flex flex-col-reverse sm:flex-row gap-4">
        {/* Thumbnails - ซ้าย (Desktop) / ล่าง (Mobile) */}
        {allImages.length > 1 && (
          <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] pb-2 sm:pb-0 sm:pr-2">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                  selectedIndex === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Image
                  src={image}
                  alt={`${productName} - รูปที่ ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Image - ขวา */}
        <div className="flex-1">
          <div
            className="relative aspect-square bg-muted rounded-xl overflow-hidden cursor-zoom-in group"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={selectedImage}
              alt={productName}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />

            {/* Zoom hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-3 py-1.5 rounded-full text-sm">
                คลิกเพื่อขยาย
              </span>
            </div>

            {/* Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrevious()
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-card rounded-full shadow-md transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-card rounded-full shadow-md transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 text-white px-2.5 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {allImages.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
              aria-label="ปิดภาพขยาย"
        >
          {/* Close Button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>

          {/* Navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                aria-label="ภาพก่อนหน้า"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-8 h-8 text-white" aria-hidden="true" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                aria-label="ภาพถัดไป"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronRight className="w-8 h-8 text-white" aria-hidden="true" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={productName}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
              {selectedIndex + 1} / {allImages.length}
            </div>
          )}

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 pb-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(index)
                  }}
                  className={cn(
                    "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                    selectedIndex === index
                      ? "border-border"
                      : "border-border hover:border-primary/60"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${productName} - รูปที่ ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}