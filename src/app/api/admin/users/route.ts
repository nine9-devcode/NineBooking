// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { requireAdmin } from "@/lib/api/guards"
import { parsePagination } from "@/lib/api/query"
import { apiError, apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"

// GET - ดึงรายการสมาชิก + สถิติ + รองรับ filter/pagination
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    // ผ่าน parsePagination เพื่อไม่ให้ ?limit=999999 ดัมป์ทั้งตารางออกไป
    const { page, limit, skip } = parsePagination(searchParams)
    const role = searchParams.get("role") || ""
    const memberType = searchParams.get("memberType") || ""
    const profileStatus = searchParams.get("profileStatus") || ""
    const statsOnly = searchParams.get("stats") === "true"

    // คำนวณสถิติ (นับจำนวนสมาชิกแยกตามประเภท)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalUsers, 
      totalAdmins, 
      newToday,
      completedProfiles,
      incompleteProfiles,
      customerCount,
      contractorCount,
      dealerCount,
      otherCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "user" } }),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      // นับ user ที่กรอกโปรไฟล์ครบแล้ว
      prisma.user.count({
        where: {
          role: "user",
          isProfileCompleted: true
        }
      }),
      // นับ user ที่ยังกรอกโปรไฟล์ไม่ครบ
      prisma.user.count({
        where: {
          role: "user",
          isProfileCompleted: false
        }
      }),
      // นับตามประเภทสมาชิก (ลูกค้า, ผู้รับเหมา, ตัวแทน, อื่นๆ)
      prisma.user.count({ where: { memberType: "customer" } }),
      prisma.user.count({ where: { memberType: "contractor" } }),
      prisma.user.count({ where: { memberType: "dealer" } }),
      prisma.user.count({ where: { memberType: "other" } }),
    ])

    const stats = {
      total: totalUsers + totalAdmins,
      users: totalUsers,
      admins: totalAdmins,
      newToday,
      completedProfiles,
      incompleteProfiles,
      byType: {
        customer: customerCount,
        contractor: contractorCount,
        dealer: dealerCount,
        other: otherCount,
      },
    }

    // ถ้าส่ง ?stats=true มา จะ return แค่สถิติอย่างเดียว ไม่ดึงรายการ
    if (statsOnly) {
      return NextResponse.json({ stats })
    }

    // สร้างเงื่อนไขค้นหา (ค้นจากชื่อ, อีเมล, ชื่อเล่น, เบอร์โทร, หมายเหตุ)
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { nickname: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { memberTypeNote: { contains: search, mode: "insensitive" } },
      ]
    }

    if (role && role !== "all") {
      where.role = role
    }

    if (memberType && memberType !== "all") {
      where.memberType = memberType
    }

    // filter ตามสถานะการกรอกโปรไฟล์
    if (profileStatus === "completed") {
      where.isProfileCompleted = true
    } else if (profileStatus === "incomplete") {
      where.isProfileCompleted = false
    }
    // ถ้าไม่ได้ส่ง profileStatus มา จะไม่ filter

    // ดึงรายการสมาชิก + นับจำนวนทั้งหมด (สำหรับ pagination)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          phone: true,
          role: true,
          memberType: true,
          memberTypeNote: true,
          image: true,
          residenceType: true,
          isProfileCompleted: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              contactIssues: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}

// POST - สร้างบัญชี Admin ใหม่
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const { name, nickname, email, password, phone } = body

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || typeof name !== "string" || name.trim().length < 3 || name.trim().length > 40) {
      return NextResponse.json({ error: "ชื่อต้องมี 3-40 ตัวอักษร" }, { status: 400 })
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 })
    }
    if (!password || typeof password !== "string" || password.length < 6 || password.length > 50) {
      return NextResponse.json({ error: "รหัสผ่านต้องมี 6-50 ตัวอักษร" }, { status: 400 })
    }
    if (!phone || !/^0[689]\d{8}$/.test(phone)) {
      return NextResponse.json({ error: "เบอร์โทรไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08, 09 และมี 10 หลัก)" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // เช็คอีเมลซ้ำ
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "อีเมลนี้มีบัญชีอยู่แล้ว" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        nickname: nickname?.trim() || null,
        email: normalizedEmail,
        password: hashedPassword,
        phone,
        role: "admin",
        isProfileCompleted: true,
      },
      select: {
        id: true, name: true, nickname: true, email: true, phone: true, role: true, createdAt: true,
      },
    })

    return NextResponse.json({ success: true, user: newAdmin }, { status: 201 })
  } catch (error) {
    console.error("Error creating admin:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างแอดมิน" }, { status: 500 })
  }
}

const patchUserSchema = z.object({
  id: z.string().min(1, "ต้องระบุ id ของสมาชิก"),
  // ต้องเป็น enum ไม่ใช่ string อิสระ ไม่งั้นตั้ง role อะไรก็ได้ที่ไม่มีอยู่จริง
  role: z.enum(["user", "admin"]).optional(),
  nickname: z.string().trim().max(40).nullable().optional(),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "เบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0")
    .nullable()
    .optional(),
})

/** ฟิลด์ที่ยอมให้หลุดออกไปหา client — ห้ามมี password เด็ดขาด */
const adminUserSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  phone: true,
  role: true,
  memberType: true,
  isProfileCompleted: true,
  createdAt: true,
  updatedAt: true,
} as const

// PATCH - เปลี่ยน role/ชื่อเล่น/เบอร์โทร ของสมาชิก
export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id, ...changes } = patchUserSchema.parse(await request.json())

    if (id === guard.user.id && changes.role && changes.role !== "admin") {
      return apiError("คุณไม่สามารถลดบทบาทของตัวเองได้")
    }

    // ต้องระบุ select เสมอ — ของเดิมคืนทั้งแถวซึ่งรวม bcrypt hash ของรหัสผ่านออกไปด้วย
    const updatedUser = await prisma.user.update({
      where: { id },
      data: changes,
      select: adminUserSelect,
    })

    return apiOk(updatedUser)
  } catch (error) {
    return handleApiError(error, "admin/users:update")
  }
}

// DELETE - ลบสมาชิก (ห้ามลบตัวเอง)
export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    
    if (id === guard.user.id) {
      return NextResponse.json({ error: "คุณไม่สามารถลบบัญชีของตัวเองได้" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ message: "ลบสมาชิกสำเร็จ" })
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบ" }, { status: 500 })
  }
}