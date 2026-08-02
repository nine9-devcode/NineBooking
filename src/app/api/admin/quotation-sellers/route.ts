// app/api/admin/quotation-sellers/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const sellers = await prisma.quotationSeller.findMany({
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ sellers })
  } catch (error) {
    console.error("Error fetching sellers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { name, phone } = await request.json()

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกชื่อและเบอร์โทร" }, { status: 400 })
    }

    // ถ้าเป็น seller คนแรก ให้ set isActive = true อัตโนมัติ
    const count = await prisma.quotationSeller.count()
    const seller = await prisma.quotationSeller.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        isActive: count === 0,
      },
    })

    return NextResponse.json({ seller }, { status: 201 })
  } catch (error) {
    console.error("Error creating seller:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
