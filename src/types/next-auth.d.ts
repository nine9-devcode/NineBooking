import type { DefaultSession } from "next-auth"

/**
 * ข้อมูลโปรไฟล์ที่พกไปกับ session/JWT
 * ประกาศไว้ตรงนี้ที่เดียว จะได้ไม่ต้อง cast `as any` ตอนอ่าน session.user
 */
interface NineBookingProfile {
  role: string
  nickname: string | null
  phone: string | null
  residenceType: string | null
  address: string | null
  province: string | null
  district: string | null
  subDistrict: string | null
  postalCode: string | null
  image: string | null
}

declare module "next-auth" {
  interface Session {
    user: { id: string } & NineBookingProfile & DefaultSession["user"]
  }

  // authorize() คืนค่าเหล่านี้ ทุกฟิลด์ optional เพราะ NextAuth ใช้ type นี้ร่วมกันหลายที่
  interface User {
    role?: string
    nickname?: string | null
    phone?: string | null
    residenceType?: string | null
    address?: string | null
    province?: string | null
    district?: string | null
    subDistrict?: string | null
    postalCode?: string | null
    image?: string | null
  }
}

// ต้องเป็น "@auth/core/jwt" ไม่ใช่ "next-auth/jwt"
// เพราะ next-auth/jwt แค่ re-export ต่อ — augment ที่นั่นจะไม่ merge เข้ากับ interface จริง
declare module "@auth/core/jwt" {
  interface JWT extends NineBookingProfile {
    id: string
  }
}

export {}
