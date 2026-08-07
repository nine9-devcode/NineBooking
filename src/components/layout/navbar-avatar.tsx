// Component/navbar-avatar
"use client"

import Image from "next/image"
import { useState } from "react"

interface NavbarAvatarProps {
  name: string
  image?: string | null
}

export function NavbarAvatar({ name, image }: NavbarAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const initial = name?.charAt(0).toUpperCase() || "U"

  // ถ้าไม่มีรูป หรือรูปโหลดไม่ได้ → แสดงตัวอักษรแรก
  if (!image || imgError) {
    return (
      <div
        className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-primary"
        style={{
          textRendering: "geometricPrecision",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <span className="text-foreground font-semibold text-sm">{initial}</span>
      </div>
    )
  }

  // ถ้ามีรูปโปรไฟล์
  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-primary">
      <Image
        src={image}
        alt={name || "Profile"}
        width={32}
        height={32}
        className="object-cover w-full h-full"
        quality={75}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
