import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

//บังคับให้เป็น Dynamic Route เพื่อไม่ให้ Next.js Cache ค่าเดิมตลอดกาล
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ดึงค่าจาก DB แบบปกติ
    const settings = await prisma.systemSettings.findFirst()

    // ถ้าไม่มีข้อมูล ให้ถือว่าเปิดเว็บ (true) ไว้ก่อน
    const showHomePage = settings ? settings.showHomePage : true

    return NextResponse.json({
      showHomePage,
    })
  } catch (error: unknown) {
    console.error("Error checking home page status:", error)
    // Fail-open: ถ้า Error ให้เปิดเว็บไว้ก่อน กัน admin เข้าไม่ได้
    return NextResponse.json({ showHomePage: true })
  }
}