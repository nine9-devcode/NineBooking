import { z } from "zod"

import { requireUser } from "@/lib/api/guards"
import { apiError, apiOk, forbidden, handleApiError, notFound } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { clientIp } from "@/lib/rate-limit"
import { RESPOND_MESSAGES, respondToQuotation } from "@/features/quotations/services/respond"

/**
 * ใบเสนอราคาฝั่งลูกค้า
 *
 * ก่อนหน้านี้มีแต่ฝั่งแอดมิน (/api/admin/quotations/**) ลูกค้าจึงดูใบเสนอราคา
 * ของตัวเองไม่ได้ และกดยอมรับไม่ได้เลย
 */

// GET — ใบเสนอราคาฉบับล่าสุดของคำสั่งจองนี้
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: { userId: true, orderNumber: true },
    })

    if (!order) return notFound("คำสั่งจอง")
    if (order.userId !== guard.user.id) return forbidden()

    const quotation = await prisma.quotation.findFirst({
      // ลูกค้าเห็นเฉพาะฉบับที่ส่งให้แล้ว ไม่เห็นฉบับร่างที่แอดมินยังทำอยู่
      where: { orderId: id, isLatest: true, status: { not: "DRAFT" } },
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        version: true,
        subtotal: true,
        includeVat: true,
        vatPercent: true,
        vatAmount: true,
        totalAmount: true,
        validUntil: true,
        notes: true,
        sentAt: true,
        respondedAt: true,
        respondedNote: true,
        createdAt: true,
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            productName: true,
            productImage: true,
            isPairedProduct: true,
            quantity: true,
            unitPrice: true,
            amount: true,
          },
        },
      },
    })

    if (!quotation) return notFound("ใบเสนอราคา")

    const canRespond =
      quotation.status === "SENT" &&
      !quotation.respondedAt &&
      quotation.validUntil >= new Date()

    return apiOk({ orderNumber: order.orderNumber, quotation, canRespond })
  } catch (error) {
    return handleApiError(error, "orders/quotation:get")
  }
}

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
  note: z.string().trim().max(500).optional(),
})

// POST — ลูกค้ากดยอมรับหรือปฏิเสธ
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireUser()
    if (!guard.ok) return guard.response

    const { id } = await params
    const { action, note } = respondSchema.parse(await request.json())

    const quotation = await prisma.quotation.findFirst({
      where: { orderId: id, isLatest: true },
      select: { id: true },
    })

    if (!quotation) return notFound("ใบเสนอราคา")

    const result = await respondToQuotation({
      quotationId: quotation.id,
      userId: guard.user.id,
      action,
      note,
      ip: clientIp(request.headers),
    })

    if (!result.ok) {
      const status = result.reason === "forbidden" ? 403 : 400
      return apiError(RESPOND_MESSAGES[result.reason], status)
    }

    return apiOk({
      status: result.status,
      message:
        action === "accept"
          ? "ยอมรับใบเสนอราคาเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็ว"
          : "บันทึกการปฏิเสธเรียบร้อยแล้ว",
    })
  } catch (error) {
    return handleApiError(error, "orders/quotation:respond")
  }
}
