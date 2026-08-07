import NextAuth, { CredentialsSignin } from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"
import { env } from "@/lib/env"
import { RATE_LIMITS, clientIp, consume, resetRateLimit } from "@/lib/rate-limit"

// error code เหล่านี้ถูกส่งกลับไปหน้า login แล้วแปลงเป็นข้อความไทยที่นั่น
class InvalidLoginError extends CredentialsSignin {
  override code = "INVALID_CREDENTIALS"
}
class AdminNotAllowedError extends CredentialsSignin {
  override code = "ADMIN_NOT_ALLOWED"
}
class AccountLockedError extends CredentialsSignin {
  override code = "ACCOUNT_LOCKED"
}

const emailKey = (email: string) => `login:email:${email}`
const ipKey = (ip: string) => `login:ip:${ip}`

export const authOptions: NextAuthConfig = {
  trustHost: true,

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // ส่ง "true" มาจากหน้า /admin/login เท่านั้น
        isAdminLogin: { label: "Is Admin Login", type: "text" },
      },

      async authorize(credentials, request) {
        const { email, password, isAdminLogin } = credentials as {
          email?: string
          password?: string
          isAdminLogin?: string
        }

        const ip = clientIp(request.headers)

        // นับต่อ IP ก่อนเสมอ แม้ input จะไม่ครบ ไม่งั้นคนยิงเลี่ยงการนับได้
        // ด้วยการส่งฟอร์มเปล่า และการนับต่อบัญชีอย่างเดียวไม่กันการสเปรย์
        // รหัสเดียวข้ามหลายพันบัญชี
        const byIp = await consume(ipKey(ip), RATE_LIMITS.loginPerIp)
        if (!byIp.ok) throw new AccountLockedError()

        if (!email || !password) throw new InvalidLoginError()

        const normalizedEmail = email.toLowerCase().trim()

        const byEmail = await consume(emailKey(normalizedEmail), RATE_LIMITS.loginPerEmail)
        if (!byEmail.ok) throw new AccountLockedError()

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (!user?.password) throw new InvalidLoginError()

        // ตรวจรหัสผ่านก่อนเช็คอย่างอื่นเสมอ
        //
        // เดิมโค้ดเช็ค role === "admin" ไว้เหนือบรรทัดนี้ ผลคือใครก็ได้ยิงรหัสมั่วๆ
        // แล้วดูว่าได้ ADMIN_NOT_ALLOWED หรือ INVALID_CREDENTIALS ก็รู้ทันทีว่า
        // อีเมลไหนเป็นแอดมิน โดยไม่ต้องรู้รหัสผ่านและไม่ถูกนับว่ากรอกผิดด้วย
        const isCorrectPassword = await bcrypt.compare(password, user.password)
        if (!isCorrectPassword) throw new InvalidLoginError()

        // แอดมินต้องเข้าผ่านหน้า /admin/login — ตอนนี้คนที่จะเห็นข้อความนี้
        // ต้องรู้รหัสผ่านที่ถูกต้องอยู่แล้ว จึงไม่ใช่ช่องให้ไล่หาบัญชีอีกต่อไป
        if (user.role === "admin" && isAdminLogin !== "true") {
          throw new AdminNotAllowedError()
        }

        await resetRateLimit(emailKey(normalizedEmail))

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          nickname: user.nickname,
          phone: user.phone,
          residenceType: user.residenceType,
          address: user.address,
          province: user.province,
          district: user.district,
          subDistrict: user.subDistrict,
          postalCode: user.postalCode,
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 วัน
  },

  callbacks: {
    // ตอน login ครั้งแรก user จะมีค่า — ยัดข้อมูลโปรไฟล์ลง token
    // ตอนแก้โปรไฟล์ ฝั่ง client เรียก update() → trigger === "update"
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role ?? "user"
        token.nickname = user.nickname ?? null
        token.phone = user.phone ?? null
        token.residenceType = user.residenceType ?? null
        token.address = user.address ?? null
        token.province = user.province ?? null
        token.district = user.district ?? null
        token.subDistrict = user.subDistrict ?? null
        token.postalCode = user.postalCode ?? null
        token.image = user.image ?? null
      }

      if (trigger === "update" && session?.user) {
        const updated = session.user
        token.name = updated.name ?? token.name
        token.nickname = updated.nickname ?? token.nickname
        token.phone = updated.phone ?? token.phone
        token.residenceType = updated.residenceType ?? token.residenceType
        token.address = updated.address ?? token.address
        token.province = updated.province ?? token.province
        token.district = updated.district ?? token.district
        token.subDistrict = updated.subDistrict ?? token.subDistrict
        token.postalCode = updated.postalCode ?? token.postalCode
        token.image = updated.image ?? token.image
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.nickname = token.nickname
        session.user.phone = token.phone
        session.user.residenceType = token.residenceType
        session.user.address = token.address
        session.user.province = token.province
        session.user.district = token.district
        session.user.subDistrict = token.subDistrict
        session.user.postalCode = token.postalCode
        session.user.image = token.image
      }
      return session
    },
  },

  secret: env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
