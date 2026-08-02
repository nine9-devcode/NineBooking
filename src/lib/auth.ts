import NextAuth, { CredentialsSignin } from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { prisma } from "@/lib/db"

// error code เหล่านี้ถูกส่งกลับไปหน้า login แล้วแปลงเป็นข้อความไทยที่นั่น
class InvalidLoginError extends CredentialsSignin {
  code = "INVALID_CREDENTIALS"
}
class AdminNotAllowedError extends CredentialsSignin {
  code = "ADMIN_NOT_ALLOWED"
}
class AccountLockedError extends CredentialsSignin {
  code = "ACCOUNT_LOCKED"
}

// กันเดารหัสผ่าน: กรอกผิดครบจำนวน → ล็อคบัญชีชั่วคราว
const LOGIN_RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  BLOCK_MINUTES: 15,
} as const

async function recordLoginFailure(email: string) {
  const now = new Date()

  const record = await prisma.loginRateLimit.upsert({
    where: { email },
    create: { email, failCount: 1, lastFailedAt: now },
    update: { failCount: { increment: 1 }, lastFailedAt: now },
  })

  if (record.failCount >= LOGIN_RATE_LIMIT.MAX_ATTEMPTS) {
    await prisma.loginRateLimit.update({
      where: { email },
      data: {
        blockedUntil: new Date(
          now.getTime() + LOGIN_RATE_LIMIT.BLOCK_MINUTES * 60 * 1000
        ),
      },
    })
  }
}

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

      async authorize(credentials) {
        const { email, password, isAdminLogin } = credentials as {
          email?: string
          password?: string
          isAdminLogin?: string
        }

        if (!email || !password) throw new InvalidLoginError()

        const normalizedEmail = email.toLowerCase().trim()

        // 1) บัญชียังถูกล็อคอยู่ไหม
        const rateLimit = await prisma.loginRateLimit.findUnique({
          where: { email: normalizedEmail },
        })

        if (rateLimit?.blockedUntil && rateLimit.blockedUntil > new Date()) {
          throw new AccountLockedError()
        }

        // หมดเวลาล็อคแล้ว → เริ่มนับใหม่
        if (rateLimit?.blockedUntil && rateLimit.blockedUntil <= new Date()) {
          await prisma.loginRateLimit.update({
            where: { email: normalizedEmail },
            data: { failCount: 0, blockedUntil: null, lastFailedAt: null },
          })
        }

        // 2) หา user
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (!user?.password) {
          await recordLoginFailure(normalizedEmail)
          throw new InvalidLoginError()
        }

        // 3) admin ต้องเข้าผ่านหน้า /admin/login เท่านั้น
        if (user.role === "admin" && isAdminLogin !== "true") {
          throw new AdminNotAllowedError()
        }

        // 4) ตรวจรหัสผ่าน
        const isCorrectPassword = await bcrypt.compare(password, user.password)
        if (!isCorrectPassword) {
          await recordLoginFailure(normalizedEmail)
          throw new InvalidLoginError()
        }

        // 5) สำเร็จ → ล้างประวัติการกรอกผิด
        if (rateLimit) {
          await prisma.loginRateLimit.delete({
            where: { email: normalizedEmail },
          })
        }

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

  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
