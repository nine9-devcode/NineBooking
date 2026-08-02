// components/admin/contact-issues/issue-image-card.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ImageIcon, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react"

interface IssueImageCardProps {
  imageUrls: string[]
}

export function IssueImageCard({ imageUrls }: IssueImageCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!imageUrls || imageUrls.length === 0) return null

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % imageUrls.length)
    }
  }

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + imageUrls.length) % imageUrls.length)
    }
  }

  return (
    <>
      <Card className="bg-card/50 border-border">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            รูปแนบ ({imageUrls.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className={`grid gap-3 ${imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {imageUrls.map((url, index) => (
              <div
                key={index}
                onClick={() => openLightbox(index)}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
              >
                <img
                  src={url}
                  alt={`Issue screenshot ${index + 1}`}
                  className={`w-full object-cover ${imageUrls.length === 1 ? 'h-64' : 'h-40'}`}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-foreground bg-background/80 px-3 py-1.5 rounded-lg text-sm">
                    <ZoomIn className="w-4 h-4" />
                    ขยาย
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            คลิกที่รูปเพื่อดูขนาดเต็ม
          </p>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>ดูรูปภาพขนาดเต็ม</DialogTitle>
          </VisuallyHidden>

          <div className="relative flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 z-10 p-2 bg-black/70 hover:bg-black/90 text-foreground rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation - Previous */}
            {imageUrls.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/70 hover:bg-black/90 text-foreground rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Full Size Image */}
            {lightboxIndex !== null && (
              <img
                src={imageUrls[lightboxIndex]}
                alt={`Issue screenshot ${lightboxIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}

            {/* Navigation - Next */}
            {imageUrls.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/70 hover:bg-black/90 text-foreground rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Image counter */}
            {imageUrls.length > 1 && lightboxIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-foreground px-3 py-1 rounded-full text-sm">
                {lightboxIndex + 1} / {imageUrls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
