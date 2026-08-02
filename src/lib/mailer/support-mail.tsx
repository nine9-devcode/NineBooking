import { render } from "@react-email/render"

import NewIssueAdminEmail from "@/emails/new-issue-admin"
import IssueResolvedCustomerEmail from "@/emails/issue-resolved-customer"
import { getAdminRecipients, mailer } from "@/lib/mailer"

export interface SupportIssueEmailData {
  issueId: string
  issueNumber: string
  customerName: string
  customerEmail: string
  subject: string
  category: string
  description: string
  createdAt: Date
  adminResponse?: string
}

/** แจ้งผู้ดูแลระบบว่ามีเรื่องแจ้งปัญหาเข้ามาใหม่ */
export async function sendNewIssueAdminEmail(data: SupportIssueEmailData) {
  const html = await render(<NewIssueAdminEmail data={data} />)

  return mailer.send({
    to: getAdminRecipients(),
    subject: `แจ้งปัญหาใหม่ ${data.issueNumber} — ${data.customerName}`,
    html,
  })
}

/** แจ้งลูกค้าเมื่อเรื่องถูกปิด */
export async function sendIssueClosedCustomerEmail(data: SupportIssueEmailData) {
  if (!data.customerEmail) {
    return { success: false, error: "ไม่มีอีเมลของลูกค้า" }
  }

  const html = await render(<IssueResolvedCustomerEmail data={data} />)

  return mailer.send({
    to: data.customerEmail,
    subject: `เรื่องแจ้งปัญหา ${data.issueNumber} ได้รับการแก้ไขแล้ว`,
    html,
  })
}
