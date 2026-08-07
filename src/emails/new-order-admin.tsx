// emails/new-order-admin.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components"
import { OrderEmailData } from "@/lib/mailer/order-mail"

interface NewOrderAdminEmailProps {
  data: OrderEmailData
}

export function NewOrderAdminEmail({ data }: NewOrderAdminEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const orderUrl = `${baseUrl}/admin/orders/${data.orderId}`

  // Format date
  const orderDate = new Date(data.createdAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  // Display name with nickname
  const displayName = data.customerNickname
    ? `${data.customerNickname} (${data.customerName})`
    : data.customerName

  return (
    <Html>
      <Head />
      <Preview>
        คำสั่งจองใหม่ {data.orderNumber} จาก {displayName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>แจ้งเตือนคำสั่งจองใหม่</Heading>
            <Text style={orderNumber}>เลขที่ใบจอง: {data.orderNumber}</Text>
            <Text style={dateText}>{orderDate}</Text>
          </Section>

          {/* Customer Info */}
          <Section style={section}>
            <Heading style={h2}>ข้อมูลลูกค้า</Heading>
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>ชื่อ-นามสกุล:</Text>
              </Column>
              <Column>
                <Text style={value}>{data.customerName}</Text>
              </Column>
            </Row>
            {data.customerNickname && (
              <Row style={infoRow}>
                <Column style={labelColumn}>
                  <Text style={label}>ชื่อเล่น:</Text>
                </Column>
                <Column>
                  <Text style={value}>{data.customerNickname}</Text>
                </Column>
              </Row>
            )}
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
            <Row style={infoRow}>
              <Column style={labelColumn}>
                <Text style={label}>หมายเลขโทรศัพท์:</Text>
              </Column>
              <Column>
                <Link href={`tel:${data.customerPhone}`} style={link}>
                  {data.customerPhone}
                </Link>
              </Column>
            </Row>
          </Section>

          <Hr
            style={{
              border: "none",
              borderTop: "1px solid #e5e7eb",
              margin: "24px 0",
            }}
          />

          {/* Order Summary */}
          <Section style={section}>
            <Heading style={h2}>สรุปรายการสินค้า</Heading>

            {data.orderItems.map((item, index) => (
              <div key={index} style={itemContainer}>
                {/* Main Product */}
                <Row>
                  <Column style={{ width: "60px" }}>
                    {item.productImage ? (
                      <Img
                        src={item.productImage}
                        alt={item.productName}
                        style={productImage}
                      />
                    ) : (
                      <div style={noImage}>-</div>
                    )}
                  </Column>
                  <Column style={{ paddingLeft: "12px" }}>
                    <Text style={productName}>{item.productName}</Text>
                    <Text style={quantityText}>
                      จำนวน: <strong>{item.mainQuantity}</strong> หน่วย
                    </Text>
                  </Column>
                </Row>

                {/* Paired Products (compact) */}
                {item.pairedProducts && item.pairedProducts.length > 0 && (
                  <div style={pairedContainer}>
                    <Text style={pairedTitle}>
                      สินค้าที่ใช้ร่วมกัน ({item.pairedProducts.length} รายการ):
                    </Text>
                    {item.pairedProducts.map((paired, pIndex) => (
                      <Row key={pIndex} style={pairedItemRow}>
                        <Column style={{ width: "40px" }}>
                          {paired.image ? (
                            <Img
                              src={paired.image}
                              alt={paired.name}
                              style={pairedProductImage}
                            />
                          ) : (
                            <div style={pairedNoImage}>-</div>
                          )}
                        </Column>
                        <Column
                          style={{ paddingLeft: "10px", verticalAlign: "middle" as const }}
                        >
                          <Text style={pairedItemName}>{paired.name}</Text>
                          <Text style={pairedItemQty}>{paired.quantity} หน่วย</Text>
                        </Column>
                      </Row>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>

          {/* Total Summary */}
          <Section style={summaryBox}>
            <Row>
              <Column>
                <Text style={summaryLabel}>สินค้าหลัก:</Text>
              </Column>
              <Column align="right">
                <Text style={summaryValue}>{data.totalMainQuantity} หน่วย</Text>
              </Column>
            </Row>
            {data.totalPairedQuantity > 0 && (
              <Row>
                <Column>
                  <Text style={summaryLabel}>สินค้าที่ใช้ร่วมกัน:</Text>
                </Column>
                <Column align="right">
                  <Text style={summaryValue}>{data.totalPairedQuantity} หน่วย</Text>
                </Column>
              </Row>
            )}
            <Hr style={miniHr} />
            <Row>
              <Column>
                <Text style={totalLabel}>จำนวนรวม:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{data.totalQuantity} หน่วย</Text>
              </Column>
            </Row>
          </Section>

          {/* Shipping Address */}
          {data.shippingAddress && (
            <>
              <Hr
                style={{
                  border: "none",
                  borderTop: "1px solid #e5e7eb",
                  margin: "24px 0",
                }}
              />
              <Section style={section}>
                <Heading style={h2}>ที่อยู่สำหรับจัดส่ง</Heading>
                {data.shippingResidenceType && (
                  <Text style={addressText}>
                    <strong>ประเภทที่อยู่อาศัย:</strong> {data.shippingResidenceType}
                  </Text>
                )}
                <Text style={addressText}>{data.shippingAddress}</Text>
                {data.shippingSubDistrict && (
                  <Text style={addressText}>
                    {data.shippingSubDistrict}
                    {data.shippingDistrict && ` ${data.shippingDistrict}`}
                  </Text>
                )}
                {data.shippingProvince && (
                  <Text style={addressText}>
                    {data.shippingProvince} {data.shippingPostalCode && data.shippingPostalCode}
                  </Text>
                )}
              </Section>
            </>
          )}

          {/* Customer Note */}
          {data.customerNote && (
            <>
              <Hr style={hr} />
              <Section style={section}>
                <Heading style={h2}>หมายเหตุจากลูกค้า</Heading>
                <Text style={noteText}>{data.customerNote}</Text>
              </Section>
            </>
          )}

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Link href={orderUrl} style={button}>
              เข้าสู่ระบบจัดการคำสั่งจอง
            </Link>
          </Section>

          {/* Footer */}

          <Section style={footer}>
            <Text style={footerText}>
              อีเมลนี้ส่งอัตโนมัติจากระบบจองสินค้า NineBooking
              <br />
              กรุณาดำเนินการภายในเวลาที่กำหนดเพื่อประสบการณ์ที่ดีของลูกค้า
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
  backgroundColor: "#3b82f6",
  borderRadius: "8px 8px 0 0",
  textAlign: "center" as const,
}

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "600",
  margin: "0 0 12px",
  letterSpacing: "-0.5px",
}

const orderNumber = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
}

const dateText = {
  color: "#bfdbfe",
  fontSize: "13px",
  margin: "8px 0 0",
  fontWeight: "400",
}

const alertBox = {
  padding: "16px 24px",
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  margin: "24px 32px",
  borderRadius: "4px",
}

const alertText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
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
  borderBottom: "2px solid #3b82f6",
  paddingBottom: "8px",
}

const infoRow = {
  marginBottom: "12px",
}

const labelColumn = {
  width: "140px",
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

const link = {
  color: "#3b82f6",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
}

const itemContainer = {
  padding: "12px",
  backgroundColor: "#fafafa",
  borderRadius: "6px",
  marginBottom: "12px",
  border: "1px solid #e5e7eb",
}

const productImage = {
  width: "60px",
  height: "60px",
  objectFit: "cover" as const,
  borderRadius: "4px",
  border: "1px solid #e5e7eb",
}

const noImage = {
  width: "60px",
  height: "60px",
  backgroundColor: "#f3f4f6",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  color: "#9ca3af",
  border: "1px solid #e5e7eb",
}

const productName = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 6px",
}

const quantityText = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
}

const pairedContainer = {
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid #e5e7eb",
}

const pairedTitle = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  margin: "0 0 6px",
}

const pairedItemRow = {
  marginBottom: "6px",
  backgroundColor: "#f9fafb",
  borderRadius: "4px",
  padding: "4px",
}

const pairedProductImage = {
  width: "40px",
  height: "40px",
  objectFit: "cover" as const,
  borderRadius: "4px",
  border: "1px solid #e5e7eb",
}

const pairedNoImage = {
  width: "40px",
  height: "40px",
  backgroundColor: "#e5e7eb",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  color: "#9ca3af",
}

const pairedItemName = {
  color: "#374151",
  fontSize: "12px",
  fontWeight: "500",
  margin: "0 0 2px",
}

const pairedItemQty = {
  color: "#6b7280",
  fontSize: "11px",
  margin: "0",
}

const summaryBox = {
  padding: "20px 32px",
  backgroundColor: "#eff6ff",
  borderRadius: "6px",
  marginTop: "24px",
  border: "1px solid #bfdbfe",
}

const summaryLabel = {
  color: "#1e40af",
  fontSize: "14px",
  margin: "6px 0",
  fontWeight: "500",
}

const summaryValue = {
  color: "#1e40af",
  fontSize: "14px",
  fontWeight: "600",
  margin: "6px 0",
}

const miniHr = {
  borderColor: "#93c5fd",
  margin: "8px 0",
}

const totalLabel = {
  color: "#1e40af",
  fontSize: "16px",
  fontWeight: "600",
  margin: "8px 0",
}

const totalValue = {
  color: "#1e40af",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "8px 0",
}

const addressText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "6px 0",
}

const noteText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  padding: "16px",
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  borderLeft: "3px solid #3b82f6",
  margin: "0",
}

const actionBox = {
  padding: "20px 32px",
  backgroundColor: "#f0fdf4",
  borderRadius: "6px",
  marginTop: "24px",
  border: "1px solid #bbf7d0",
}

const actionTitle = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
}

const actionText = {
  color: "#166534",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "8px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  padding: "0 32px",
}

const button = {
  backgroundColor: "#3b82f6",
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

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 32px",
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

export default NewOrderAdminEmail
