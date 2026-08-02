import { render } from "@react-email/render"

import NewOrderAdminEmail from "@/emails/new-order-admin"
import OrderConfirmationEmail from "@/emails/order-confirmation"
import { getAdminRecipients, mailer } from "@/lib/mailer"

export interface OrderEmailData {
  orderId: string
  orderNumber: string
  customerName: string
  customerNickname?: string | null
  customerEmail: string
  customerPhone?: string | null

  orderItems: Array<{
    productName: string
    productImage?: string | null
    mainQuantity: number
    pairedProducts?: Array<{
      name: string
      image?: string | null
      quantity: number
    }>
  }>

  shippingAddress?: string | null
  shippingProvince?: string | null
  shippingDistrict?: string | null
  shippingSubDistrict?: string | null
  shippingPostalCode?: string | null
  shippingResidenceType?: string | null

  customerNote?: string | null

  totalMainQuantity: number
  totalPairedQuantity: number
  totalQuantity: number

  createdAt: Date
}

/**
 * ส่งอีเมลสองฉบับพร้อมกันเมื่อมีการจอง: แจ้งผู้ดูแลระบบ + ยืนยันให้ลูกค้า
 * ใช้ allSettled เพื่อให้ฉบับหนึ่งพังไม่ทำให้อีกฉบับไม่ถูกส่ง
 */
export async function sendOrderEmails(data: OrderEmailData) {
  const displayName = data.customerNickname
    ? `${data.customerNickname} (${data.customerName})`
    : data.customerName

  const [adminHtml, customerHtml] = await Promise.all([
    render(<NewOrderAdminEmail data={data} />),
    render(<OrderConfirmationEmail data={data} />),
  ])

  const [adminResult, customerResult] = await Promise.allSettled([
    mailer.send({
      to: getAdminRecipients(),
      subject: `คำสั่งจองใหม่ ${data.orderNumber} — ${displayName}`,
      html: adminHtml,
    }),
    mailer.send({
      to: data.customerEmail,
      subject: `ยืนยันการจอง ${data.orderNumber} — NineBooking`,
      html: customerHtml,
    }),
  ])

  return {
    success:
      adminResult.status === "fulfilled" || customerResult.status === "fulfilled",
    adminResult,
    customerResult,
  }
}
