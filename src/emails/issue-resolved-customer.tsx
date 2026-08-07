// emails/issue-resolved-customer.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components"
import { SupportIssueEmailData } from "@/lib/mailer/support-mail"

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING: "การจอง",
  PAYMENT: "การชำระเงิน",
  USAGE_ISSUE: "ปัญหาการใช้งาน",
  ACCOUNT: "บัญชีผู้ใช้",
  OTHER: "อื่นๆ",
}

interface IssueResolvedCustomerEmailProps {
  data: SupportIssueEmailData
}

export function IssueResolvedCustomerEmail({ data }: IssueResolvedCustomerEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const supportUrl = `${baseUrl}/support`

  const resolvedDate = new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const categoryLabel = CATEGORY_LABELS[data.category] || data.category

  return (
    <Html>
      <Head />
      <Preview>ปัญหาของคุณได้รับการแก้ไขแล้ว - {data.issueNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>ปัญหาของคุณได้รับการแก้ไขแล้ว</Heading>
            <Text style={issueNumberStyle}>เลขที่ติดตาม: {data.issueNumber}</Text>
            <Text style={dateText}>{resolvedDate}</Text>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>
              <strong>เรียน</strong> {data.customerName}
            </Text>
            <Text style={text}>
              ทีมงาน NineBooking ได้ดำเนินการแก้ไขปัญหาของคุณเรียบร้อยแล้ว
              กรุณาตรวจสอบรายละเอียดด้านล่าง
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Issue Summary */}
          <Section style={section}>
            <Heading style={h2}>สรุปปัญหาที่แจ้ง</Heading>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>ประเภท:</Text>
              </Column>
              <Column>
                <Text style={value}>{categoryLabel}</Text>
              </Column>
            </Row>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>หัวข้อ:</Text>
              </Column>
              <Column>
                <Text style={value}>{data.subject}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Admin Response */}
          {data.adminResponse && (
            <Section style={section}>
              <Heading style={h2}>คำตอบจากทีมงาน</Heading>
              <Text style={responseText}>{data.adminResponse}</Text>
            </Section>
          )}

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Link href={supportUrl} style={button}>
              ดูประวัติการแจ้งปัญหา
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>ติดต่อสอบถามเพิ่มเติม</strong>
              <br />
              หมายเลขโทรศัพท์: 081-694-2896
              <br />
              เวลาทำการ: จันทร์-เสาร์ เวลา 08:30-17:30 น.
            </Text>
            <Text style={footerText}>อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ</Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} NineBooking. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ================================
// Styles
// ================================

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '"Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
}

const header = {
  padding: "32px 32px 24px",
  backgroundColor: "#f97316",
  borderRadius: "8px 8px 0 0",
  textAlign: "center" as const,
}

const h1 = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "600",
  margin: "0 0 12px",
  letterSpacing: "-0.5px",
}

const issueNumberStyle = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
}

const dateText = {
  color: "#fed7aa",
  fontSize: "13px",
  margin: "8px 0 0",
  fontWeight: "400",
}

const section = {
  padding: "0 32px",
  marginTop: "24px",
}

const h2 = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
  borderBottom: "2px solid #f97316",
  paddingBottom: "8px",
}

const text = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 12px",
}

const infoRow = {
  marginBottom: "12px",
}

const labelColumn = {
  width: "100px",
  verticalAlign: "top" as const,
}

const label = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
}

const value = {
  color: "#111827",
  fontSize: "14px",
  margin: "0",
  fontWeight: "500",
}

const responseText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "16px",
  backgroundColor: "#fff7ed",
  borderRadius: "6px",
  borderLeft: "3px solid #f97316",
  margin: "0",
}

const hr = {
  border: "none",
  borderTop: "1px solid #e5e7eb",
  margin: "24px 32px",
}

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  padding: "0 32px",
}

const button = {
  backgroundColor: "#f97316",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
}

const footer = {
  padding: "24px 32px 0",
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
  marginTop: "32px",
}

const footerText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 12px",
}

const footerCopyright = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "16px 0 0",
}

export default IssueResolvedCustomerEmail
