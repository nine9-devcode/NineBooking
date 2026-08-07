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

    const [entries, total, actors] = await Promise.all([
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
          before: true,
          after: true,
          ip: true,
          createdAt: true,
          actor: { select: { id: true, name: true, nickname: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
      // รายชื่อผู้กระทำสำหรับตัวกรอง — เอาเฉพาะคนที่มีบันทึกจริง
      prisma.auditLog.findMany({
        distinct: ["actorId"],
        select: { actor: { select: { id: true, name: true, nickname: true } } },
        take: 50,
      }),
    ])

    return apiOk({
      entries,
      actors: actors.map((row) => row.actor),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, "admin/audit-log")
  }
}
