import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { getErrorMessage } from "@/lib/utils"

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
  } catch (error: unknown) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
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

    if (settings) {
      await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { showHomePage },
      })
    } else {
      await prisma.systemSettings.create({
        data: { showHomePage },
      })
    }

    return NextResponse.json({
      settings: { showHomePage },
      message: "อัปเดตการตั้งค่าสำเร็จ",
    })
  } catch (error: unknown) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}