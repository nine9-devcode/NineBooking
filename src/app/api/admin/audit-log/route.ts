import { NextRequest } from "next/server"
import { Prisma } from "@prisma/client"

import { requireAdmin } from "@/lib/api/guards"
import { parsePagination } from "@/lib/api/query"
import { apiOk, handleApiError } from "@/lib/api/response"
import { prisma } from "@/lib/db"

// GET /api/admin/audit-log — ประวัติการกระทำของผู้ดูแลระบบ
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 25 })

    const where: Prisma.AuditLogWhereInput = {}

    // ค้นจากสิ่งที่คนจำได้จริง — เลขที่เอกสาร ชื่อสินค้า หรือชื่อ/อีเมลของคนที่ทำ
    // ไม่ใช่ entityId ที่เป็น cuid ภายใน
    //
    // สาขาแรกใช้ index trgm ได้ ส่วนสาขาที่เหลือ Postgres จะ join กับ User แล้วกรอง
    // ซึ่งถูกเพราะจำนวนแอดมินอยู่หลักสิบ ไม่ได้ scan AuditLog ทั้งตาราง
    const q = searchParams.get("q")?.trim()
    if (q) {
      where.OR = [
        { entityLabel: { contains: q, mode: "insensitive" } },
        { actor: { name: { contains: q, mode: "insensitive" } } },
        { actor: { nickname: { contains: q, mode: "insensitive" } } },
        { actor: { email: { contains: q, mode: "insensitive" } } },
      ]
    }

    const action = searchParams.get("action")
    if (action && action !== "all") where.action = action

    const entityType = searchParams.get("entityType")
    if (entityType && entityType !== "all") where.entityType = entityType

    const actorId = searchParams.get("actorId")
    if (actorId && actorId !== "all") where.actorId = actorId

    const from = searchParams.get("from")
    const to = searchParams.get("to")
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        // ครอบทั้งวันของ to ไม่ใช่แค่เที่ยงคืน ไม่งั้นเลือกช่วงวันเดียวแล้วไม่เจออะไร
        ...(to && { lte: new Date(new Date(to).setHours(23, 59, 59, 999)) }),
      }
    }

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          entityLabel: true,
          before: true,
          after: true,
          ip: true,
          createdAt: true,
          actor: { select: { id: true, name: true, nickname: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return apiOk({
      entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, "admin/audit-log")
  }
}
