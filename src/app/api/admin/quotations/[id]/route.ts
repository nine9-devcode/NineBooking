// app/api/admin/quotations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { updateQuotationSchema } from "@/features/quotations/components/schema"
import { Decimal } from "@prisma/client/runtime/library"

// GET - ดึงรายละเอียดใบเสนอราคา
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true,
                email: true,
                image: true,
                memberType: true,
                memberTypeNote: true,
                createdAt: true,
              },
            },
          },
        },
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: "ไม่พบใบเสนอราคา" }, { status: 404 })
    }

    // Auto-expire isLatest
    if (
      quotation.isLatest &&
      (quotation.status === "DRAFT" || quotation.status === "SENT") &&
      quotation.validUntil < new Date()
    ) {
      await prisma.quotation.update({
        where: { id },
        data: { status: "EXPIRED" },
      })
      quotation.status = "EXPIRED"
    }

    // ดึง versions ทั้งหมดของ baseNumber เดียวกัน
    const baseNum = quotation.baseNumber || quotation.quotationNumber
    const allVersions = await prisma.quotation.findMany({
      where: { baseNumber: baseNum },
      select: {
        id: true,
        version: true,
        quotationNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        isLatest: true,
      },
      orderBy: { version: "desc" },
    })

    return NextResponse.json({
      quotation: {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        orderId: quotation.orderId,
        orderNumber: quotation.order.orderNumber,
        customer: {
          name: quotation.order.customerName,
          nickname: quotation.order.customerNickname,
          email: quotation.order.customerEmail,
          phone: quotation.order.customerPhone,
        },
        shipping: {
          address: quotation.order.shippingAddress,
          province: quotation.order.shippingProvince,
          district: quotation.order.shippingDistrict,
          subDistrict: quotation.order.shippingSubDistrict,
          postalCode: quotation.order.shippingPostalCode,
          residenceType: quotation.order.shippingResidenceType,
        },
        user: quotation.order.user
          ? {
              id: quotation.order.user.id,
              name: quotation.order.user.name,
              nickname: quotation.order.user.nickname,
              email: quotation.order.user.email,
              image: quotation.order.user.image,
              memberType: quotation.order.user.memberType,
              memberTypeNote: quotation.order.user.memberTypeNote,
              memberSince: quotation.order.user.createdAt?.toISOString() || null,
            }
          : null,
        items: quotation.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          isPairedProduct: item.isPairedProduct,
          pairedWithIndex: item.pairedWithIndex,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          amount: Number(item.amount),
          sortOrder: item.sortOrder,
        })),
        subtotal: Number(quotation.subtotal),
        includeVat: quotation.includeVat,
        vatPercent: Number(quotation.vatPercent),
        vatAmount: Number(quotation.vatAmount),
        totalAmount: Number(quotation.totalAmount),
        validDays: quotation.validDays,
        validUntil: quotation.validUntil.toISOString(),
        notes: quotation.notes,
        pdfNotes: quotation.pdfNotes,
        status: quotation.status,
        createdBy: quotation.createdBy,
        createdByName: quotation.createdByName,
        createdAt: quotation.createdAt.toISOString(),
        updatedAt: quotation.updatedAt.toISOString(),
        version: quotation.version,
        baseNumber: baseNum,
        isLatest: quotation.isLatest,
        versions: allVersions.map((v) => ({
          id: v.id,
          version: v.version,
          quotationNumber: v.quotationNumber,
          status: v.status,
          totalAmount: Number(v.totalAmount),
          createdAt: v.createdAt.toISOString(),
          isLatest: v.isLatest,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" }, { status: 500 })
  }
}

// PATCH - อัปเดตใบเสนอราคา (สร้าง version ใหม่ถ้าราคาเปลี่ยน)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()

    const validationResult = updateQuotationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    })

    if (!existingQuotation) {
      return NextResponse.json({ error: "ไม่พบใบเสนอราคา" }, { status: 404 })
    }

    // ===== ถ้ามี items → ตรวจสอบว่าราคาเปลี่ยนไหม =====
    if (data.items && data.items.length > 0) {
      const oldPrices = existingQuotation.items.map((i) => Number(i.unitPrice))
      const newPrices = data.items.map((i) => i.unitPrice)
      const pricesChanged =
        oldPrices.length !== newPrices.length ||
        oldPrices.some((p, idx) => p !== newPrices[idx])

      if (pricesChanged) {
        // ===== สร้าง VERSION ใหม่ =====
        const baseNum = existingQuotation.baseNumber || existingQuotation.quotationNumber
        const newVersion = existingQuotation.version + 1
        const newQuotationNumber = `${baseNum}V${newVersion}`

        const tempIdToIndex: Record<string, number> = {}
        data.items.forEach((item, index) => {
          tempIdToIndex[item.tempId] = index
        })

        const subtotal = data.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        )
        const includeVat = data.includeVat ?? existingQuotation.includeVat
        const vatPercent = data.vatPercent ?? Number(existingQuotation.vatPercent)
        const vatAmount = includeVat ? subtotal * (vatPercent / 100) : 0
        const totalAmount = subtotal + vatAmount
        const validDays = data.validDays ?? existingQuotation.validDays
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + validDays)

        const [, newQuotation] = await prisma.$transaction([
          // Lock version เก่า
          prisma.quotation.update({
            where: { id },
            data: { isLatest: false },
          }),
          // สร้าง version ใหม่
          prisma.quotation.create({
            data: {
              quotationNumber: newQuotationNumber,
              baseNumber: baseNum,
              version: newVersion,
              isLatest: true,
              orderId: existingQuotation.orderId,
              status: "DRAFT",
              subtotal: new Decimal(subtotal),
              includeVat,
              vatPercent: new Decimal(vatPercent),
              vatAmount: new Decimal(vatAmount),
              totalAmount: new Decimal(totalAmount),
              validDays,
              validUntil,
              notes: data.notes !== undefined ? data.notes || null : existingQuotation.notes,
              pdfNotes:
                data.pdfNotes !== undefined ? data.pdfNotes : existingQuotation.pdfNotes,
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
                  amount: new Decimal(item.quantity * item.unitPrice),
                  sortOrder: index,
                })),
              },
            },
          }),
        ])

        return NextResponse.json({
          success: true,
          isNewVersion: true,
          quotation: {
            id: newQuotation.id,
            quotationNumber: newQuotation.quotationNumber,
            status: newQuotation.status,
            version: newQuotation.version,
          },
        })
      }

      // ราคาไม่เปลี่ยน — ยังต้องอัปเดต items (rebuild) เหมือนเดิม
      const tempIdToIndex: Record<string, number> = {}
      data.items.forEach((item, index) => {
        tempIdToIndex[item.tempId] = index
      })
      const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
      const includeVat = data.includeVat ?? existingQuotation.includeVat
      const vatPercent = data.vatPercent ?? Number(existingQuotation.vatPercent)
      const vatAmount = includeVat ? subtotal * (vatPercent / 100) : 0
      const totalAmount = subtotal + vatAmount

      await prisma.quotationItem.deleteMany({ where: { quotationId: id } })
      await prisma.quotationItem.createMany({
        data: data.items.map((item, index) => ({
          quotationId: id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          isPairedProduct: item.isPairedProduct,
          pairedWithIndex: item.pairedWithTempId
            ? (tempIdToIndex[item.pairedWithTempId] ?? null)
            : null,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          amount: new Decimal(item.quantity * item.unitPrice),
          sortOrder: index,
        })),
      })

      const updateData: any = {
        subtotal: new Decimal(subtotal),
        vatAmount: new Decimal(vatAmount),
        totalAmount: new Decimal(totalAmount),
      }
      if (data.includeVat !== undefined) updateData.includeVat = data.includeVat
      if (data.vatPercent !== undefined) updateData.vatPercent = new Decimal(data.vatPercent)
      if (data.validDays !== undefined) {
        updateData.validDays = data.validDays
        const validUntil = new Date(existingQuotation.createdAt)
        validUntil.setDate(validUntil.getDate() + data.validDays)
        updateData.validUntil = validUntil
      }
      if (data.notes !== undefined) updateData.notes = data.notes || null
      if (data.pdfNotes !== undefined) updateData.pdfNotes = data.pdfNotes
      if (data.status !== undefined) updateData.status = data.status

      const updated = await prisma.quotation.update({ where: { id }, data: updateData })
      return NextResponse.json({
        success: true,
        isNewVersion: false,
        quotation: {
          id: updated.id,
          quotationNumber: updated.quotationNumber,
          status: updated.status,
          version: updated.version,
        },
      })
    }

    // ===== ไม่มี items — อัปเดต in-place (status/notes/VAT/validDays) =====
    const updateData: any = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.includeVat !== undefined) updateData.includeVat = data.includeVat
    if (data.vatPercent !== undefined) updateData.vatPercent = new Decimal(data.vatPercent)
    if (data.validDays !== undefined) {
      updateData.validDays = data.validDays
      const validUntil = new Date(existingQuotation.createdAt)
      validUntil.setDate(validUntil.getDate() + data.validDays)
      updateData.validUntil = validUntil
    }
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.pdfNotes !== undefined) updateData.pdfNotes = data.pdfNotes

    if (data.includeVat !== undefined || data.vatPercent !== undefined) {
      const includeVat = data.includeVat ?? existingQuotation.includeVat
      const vatPercent = data.vatPercent ?? Number(existingQuotation.vatPercent)
      const subtotal = Number(existingQuotation.subtotal)
      const vatAmount = includeVat ? subtotal * (vatPercent / 100) : 0
      updateData.vatAmount = new Decimal(vatAmount)
      updateData.totalAmount = new Decimal(subtotal + vatAmount)
    }

    const updatedQuotation = await prisma.quotation.update({ where: { id }, data: updateData })

    return NextResponse.json({
      success: true,
      isNewVersion: false,
      quotation: {
        id: updatedQuotation.id,
        quotationNumber: updatedQuotation.quotationNumber,
        status: updatedQuotation.status,
        version: updatedQuotation.version,
        updatedAt: updatedQuotation.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating quotation:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 })
  }
}

// DELETE - ลบใบเสนอราคา (version-aware)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params

    const existingQuotation = await prisma.quotation.findUnique({ where: { id } })

    if (!existingQuotation) {
      return NextResponse.json({ error: "ไม่พบใบเสนอราคา" }, { status: 404 })
    }

    // ถ้าลบ version ล่าสุด และมี version ก่อนหน้า → คืนสถานะ isLatest ให้ version เก่า
    if (existingQuotation.isLatest && existingQuotation.version > 1) {
      const baseNum = existingQuotation.baseNumber || existingQuotation.quotationNumber
      await prisma.quotation.updateMany({
        where: {
          baseNumber: baseNum,
          version: existingQuotation.version - 1,
        },
        data: { isLatest: true },
      })
    }

    await prisma.quotation.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "ลบใบเสนอราคาเรียบร้อยแล้ว" })
  } catch (error) {
    console.error("Error deleting quotation:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบ" }, { status: 500 })
  }
}
