import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/api/guards"
import { handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { AUDIT_ACTIONS, recordAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rate-limit"

// GET: ดึงการตั้งค่า
export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    // ใช้ findFirst แทน queryRaw
    let settings = await prisma.systemSettings.findFirst()

    // ถ้ายังไม่มี settings ให้สร้างค่าเริ่มต้นทันที
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          showHomePage: true,
        },
      })
    }

    return NextResponse.json({
      settings: {
        showHomePage: settings.showHomePage,
      },
    })
  } catch (error) {
    return handleApiError(error, "admin/settings:get")
  }
}

// PATCH: อัปเดตการตั้งค่า
export async function PATCH(request: Request) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { showHomePage } = body

    if (typeof showHomePage !== "boolean") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // ใช้ upsert: ถ้ามีให้อัปเดต ถ้าไม่มีให้สร้างใหม่ (จัดการ Id ให้เอง)
    const settings = await prisma.systemSettings.findFirst()

    await prisma.$transaction(async (tx) => {
      const saved = settings
        ? await tx.systemSettings.update({
            where: { id: settings.id },
            data: { showHomePage },
          })
        : await tx.systemSettings.create({ data: { showHomePage } })

      // การปิดเว็บทั้งระบบเป็นการกระทำที่ต้องตอบได้ว่าใครสั่ง
      if (settings?.showHomePage !== showHomePage) {
        await recordAudit(tx, {
          actorId: guard.user.id,
          action: AUDIT_ACTIONS.SETTINGS_UPDATED,
          entityType: "Settings",
          entityId: saved.id,
          entityLabel: "การตั้งค่าระบบ",
          before: { showHomePage: settings?.showHomePage ?? null },
          after: { showHomePage },
          ip: clientIp(request.headers),
        })
      }
    })

    return NextResponse.json({
      settings: { showHomePage },
      message: "อัปเดตการตั้งค่าสำเร็จ",
    })
  } catch (error) {
    return handleApiError(error, "admin/settings:update")
  }
}
