// app/api/admin/quotations/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { AUDIT_ACTIONS, recordAuditSafely } from "@/lib/audit"
import { clientIp } from "@/lib/rate-limit"
import { createQuotationSchema } from "@/features/quotations/components/schema"
import { Decimal } from "@prisma/client/runtime/library"
import { Prisma, QuotationStatus } from "@prisma/client"
import { parseEnumParam, parsePagination } from "@/lib/api/query"
import { nextQuotationBaseNumber } from "@/lib/document-number"
import { calculateQuotationTotals, lineAmount } from "@/features/quotations/totals"

// GET - ดึงรายการใบเสนอราคาทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""

    // Build where clause — เฉพาะ version ล่าสุด
    const where: Prisma.QuotationWhereInput = { isLatest: true }

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { order: { customerName: { contains: search, mode: "insensitive" } } },
        { order: { customerEmail: { contains: search, mode: "insensitive" } } },
        { order: { customerPhone: { contains: search } } },
        { order: { user: { memberTypeNote: { contains: search, mode: "insensitive" } } } },
      ]
    }

    if (status && status !== "all") {
      where.status = parseEnumParam(QuotationStatus, status)
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // Auto-expire isLatest ที่หมดอายุ
    await prisma.quotation.updateMany({
      where: {
        status: { in: ["DRAFT", "SENT"] },
        validUntil: { lt: new Date() },
        isLatest: true,
      },
      data: { status: "EXPIRED" },
    })

    // Get quotations with pagination
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  image: true,
                  memberType: true,
                  memberTypeNote: true,
                },
              },
            },
          },
          items: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ])

    // Get stats — นับเฉพาะ isLatest
    const [totalCount, draftCount, sentCount, acceptedCount, rejectedCount, expiredCount] =
      await Promise.all([
        prisma.quotation.count({ where: { isLatest: true } }),
        prisma.quotation.count({ where: { status: "DRAFT", isLatest: true } }),
        prisma.quotation.count({ where: { status: "SENT", isLatest: true } }),
        prisma.quotation.count({ where: { status: "ACCEPTED", isLatest: true } }),
        prisma.quotation.count({ where: { status: "REJECTED", isLatest: true } }),
        prisma.quotation.count({ where: { status: "EXPIRED", isLatest: true } }),
      ])

    // Format response
    const formattedQuotations = quotations.map((q) => ({
      id: q.id,
      quotationNumber: q.quotationNumber,
      orderId: q.orderId,
      orderNumber: q.order.orderNumber,
      customer: {
        id: q.order.user?.id || null,
        name: q.order.customerName,
        nickname: q.order.customerNickname,
        email: q.order.customerEmail,
        phone: q.order.customerPhone,
        image: q.order.user?.image || null,
        memberType: q.order.user?.memberType || null,
        memberTypeNote: q.order.user?.memberTypeNote || null,
        userDeleted: q.order.user === null,
      },
      itemCount: q.items.length,
      subtotal: Number(q.subtotal),
      includeVat: q.includeVat,
      vatAmount: Number(q.vatAmount),
      totalAmount: Number(q.totalAmount),
      status: q.status,
      validUntil: q.validUntil.toISOString(),
      createdAt: q.createdAt.toISOString(),
      createdByName: q.createdByName,
      version: q.version,
      baseNumber: q.baseNumber,
    }))

    return NextResponse.json({
      quotations: formattedQuotations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalCount,
        DRAFT: draftCount,
        SENT: sentCount,
        ACCEPTED: acceptedCount,
        REJECTED: rejectedCount,
        EXPIRED: expiredCount,
      },
    })
  } catch (error) {
    console.error("Error fetching quotations:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}

// POST - สร้างใบเสนอราคาใหม่
export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()

    // Validate input
    const validationResult = createQuotationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    })

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งจองที่ระบุ" }, { status: 404 })
    }

    // ยอดเงินคำนวณด้วย Decimal ตลอดสาย ไม่ผ่าน float
    const { subtotal, vatAmount, totalAmount } = calculateQuotationTotals(data.items, {
      includeVat: data.includeVat,
      vatPercent: data.vatPercent,
    })

    // Calculate valid until date
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + data.validDays)

    // Build tempId to sortOrder mapping for pairedWithIndex
    const tempIdToIndex: Record<string, number> = {}
    data.items.forEach((item, index) => {
      tempIdToIndex[item.tempId] = index
    })

    // เลขที่ใบเสนอราคาขอในทรานแซกชันเดียวกับที่สร้างเอกสาร
    // ของเดิมอ่านเลขล่าสุดแล้ว +1 ไว้ข้างนอก ซึ่งชนกันได้เมื่อแอดมินสองคนออกใบพร้อมกัน
    const quotation = await prisma.$transaction(async (tx) => {
      const quotationNumber = await nextQuotationBaseNumber(tx)

      return tx.quotation.create({
        data: {
          quotationNumber,
          baseNumber: quotationNumber,
          version: 1,
          isLatest: true,
          orderId: data.orderId,
          subtotal,
          includeVat: data.includeVat,
          vatPercent: new Decimal(data.vatPercent),
          vatAmount,
          totalAmount,
          validDays: data.validDays,
          validUntil,
          notes: data.notes || null,
          pdfNotes: data.pdfNotes !== undefined ? data.pdfNotes : null,
          status: "DRAFT",
          createdBy: guard.user.id,
          createdByName: guard.user.name || "Admin",
          items: {
            create: data.items.map((item, index) => ({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              isPairedProduct: item.isPairedProduct,
              pairedWithIndex: item.pairedWithTempId
                ? (tempIdToIndex[item.pairedWithTempId] ?? null)
                : null,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice),
              amount: lineAmount(item),
              sortOrder: index,
            })),
          },
        },
      })
    })

    await recordAuditSafely({
      actorId: guard.user.id,
      action: AUDIT_ACTIONS.QUOTATION_CREATED,
      entityType: "Quotation",
      entityId: quotation.id,
      entityLabel: quotation.quotationNumber,
      after: {
        quotationNumber: quotation.quotationNumber,
        totalAmount: quotation.totalAmount.toString(),
      },
      ip: clientIp(request.headers),
    })

    return NextResponse.json({
      success: true,
      quotation: {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: quotation.status,
      },
    })
  } catch (error) {
    console.error("Error creating quotation:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างใบเสนอราคา" }, { status: 500 })
  }
}
