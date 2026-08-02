// ไฟล์: app/api/seo-settings/route.ts
// API สำหรับดึง SEO Settings (Public - ใช้ใน layout.tsx)

import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Cache settings for 5 minutes
let cachedSettings: any = null
let cacheTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    // Check cache
    const now = Date.now()
    if (cachedSettings && now - cacheTime < CACHE_DURATION) {
      return NextResponse.json({ settings: cachedSettings })
    }

    // ดึง settings จาก database
    let settings = await prisma.seoSettings.findFirst()

    // ถ้ายังไม่มี ใช้ค่า default
    if (!settings) {
      settings = {
        id: "default",
        siteTitle: "NineBooking",
        siteDescription: "ระบบจองสินค้าออนไลน์ พร้อมระบบหลังบ้านครบวงจร",
        ogImage: null,
        googleAnalyticsId: null,
        facebookUrl: null,
        lineUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Update cache
    cachedSettings = settings
    cacheTime = now

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching SEO settings:", error)
    
    // Return default settings on error
    return NextResponse.json({
      settings: {
        siteTitle: "NineBooking",
        siteDescription: "ระบบจองสินค้าออนไลน์ พร้อมระบบหลังบ้านครบวงจร",
        ogImage: null,
        googleAnalyticsId: null,
      },
    })
  }
}