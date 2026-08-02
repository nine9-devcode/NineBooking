import Image from "next/image"

interface ProfileAvatarProps {
  name: string
  image?: string | null
  size?: "sm" | "md" | "lg"
}

export function ProfileAvatar({ name, image, size = "md" }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-24 h-24 text-3xl",
    lg: "w-32 h-32 text-4xl",
  }

  const borderClasses = {
    sm: "border-2",
    md: "border-4",
    lg: "border-4",
  }

  const imageSizes = {
    sm: 48,
    md: 96,
    lg: 128,
  }

  // ถ้ามีรูปโปรไฟล์
  if (image) {
    return (
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden ${borderClasses[size]} border-primary shadow-lg`}>
        <Image
          src={image}
          alt={name || "Profile"}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-cover w-full h-full"
          quality={95}
          priority
          style={{
            imageRendering: 'crisp-edges',
          }}
        />
      </div>
    )
  }

  // ถ้าไม่มีรูป → แสดงตัวอักษรแรก
  const initial = name?.charAt(0).toUpperCase() || "U"
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-foreground font-bold ${borderClasses[size]} border-primary shadow-lg`}
      style={{
        textRendering: 'geometricPrecision',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {initial}
    </div>
  )
}