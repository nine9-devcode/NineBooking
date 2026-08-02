// emails/new-issue-admin.tsx
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
} from '@react-email/components'
import { SupportIssueEmailData } from '@/lib/mailer/support-mail'

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING: 'การจอง',
  PAYMENT: 'การชำระเงิน',
  USAGE_ISSUE: 'ปัญหาการใช้งาน',
  ACCOUNT: 'บัญชีผู้ใช้',
  OTHER: 'อื่นๆ',
}

interface NewIssueAdminEmailProps {
  data: SupportIssueEmailData
}

export function NewIssueAdminEmail({ data }: NewIssueAdminEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const issueUrl = `${baseUrl}/admin/contact-issues/${data.issueId}`

  const issueDate = new Date(data.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const categoryLabel = CATEGORY_LABELS[data.category] || data.category

  return (
    <Html>
      <Head />
      <Preview>แจ้งปัญหาใหม่ {data.issueNumber} จาก {data.customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>แจ้งเตือนปัญหาใหม่</Heading>
            <Text style={issueNumberStyle}>เลขที่ติดตาม: {data.issueNumber}</Text>
            <Text style={dateText}>{issueDate}</Text>
          </Section>

          {/* Category Badge */}
          <Section style={section}>
            <Text style={categoryBadge}>ประเภท: {categoryLabel}</Text>
          </Section>

          {/* Issue Info */}
          <Section style={section}>
            <Heading style={h2}>รายละเอียดปัญหา</Heading>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>หัวข้อ:</Text>
              </Column>
              <Column>
                <Text style={value}>{data.subject}</Text>
              </Column>
            </Row>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>รายละเอียด:</Text>
              </Column>
              <Column>
                <Text style={descriptionText}>{data.description}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Customer Info */}
          <Section style={section}>
            <Heading style={h2}>ข้อมูลผู้แจ้ง</Heading>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>ชื่อ-นามสกุล:</Text>
              </Column>
              <Column>
                <Text style={value}>{data.customerName}</Text>
              </Column>
            </Row>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>อีเมล:</Text>
              </Column>
              <Column>
                <Link href={`mailto:${data.customerEmail}`} style={link}>
                  {data.customerEmail}
                </Link>
              </Column>
            </Row>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Link href={issueUrl} style={button}>
              จัดการปัญหานี้
            </Link>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              อีเมลนี้ส่งอัตโนมัติจากระบบแจ้งปัญหา NineBooking
              <br />
              กรุณาดำเนินการโดยเร็วที่สุดเพื่อประสบการณ์ที่ดีของลูกค้า
            </Text>
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
  backgroundColor: '#f6f9fc',
  fontFamily:
    '"Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
}

const header = {
  padding: '32px 32px 24px',
  backgroundColor: '#3b82f6',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0 0 12px',
  letterSpacing: '-0.5px',
}

const issueNumberStyle = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
}

const dateText = {
  color: '#bfdbfe',
  fontSize: '13px',
  margin: '8px 0 0',
  fontWeight: '400',
}

const section = {
  padding: '0 32px',
  marginTop: '24px',
}

const h2 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
  borderBottom: '2px solid #3b82f6',
  paddingBottom: '8px',
}

const categoryBadge = {
  display: 'inline-block',
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  padding: '6px 16px',
  borderRadius: '20px',
  border: '1px solid #bfdbfe',
  margin: '0',
}

const infoRow = {
  marginBottom: '12px',
}

const labelColumn = {
  width: '120px',
  verticalAlign: 'top' as const,
}

const label = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
}

const value = {
  color: '#111827',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
}

const descriptionText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  padding: '12px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  borderLeft: '3px solid #3b82f6',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '24px 32px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  padding: '0 32px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}

const footer = {
  padding: '24px 32px 0',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px',
}

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '16px 0 0',
}

export default NewIssueAdminEmail
