// emails/order-confirmation.tsx
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
} from '@react-email/components'
import { OrderEmailData } from '@/lib/mailer/order-mail'

interface OrderConfirmationEmailProps {
  data: OrderEmailData
}

export function OrderConfirmationEmail({ data }: OrderConfirmationEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const orderUrl = `${baseUrl}/orders/${data.orderId}`

  // Format date
  const orderDate = new Date(data.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Display name with nickname
  const displayName = data.customerNickname
    ? `${data.customerNickname} (${data.customerName})`
    : data.customerName

  return (
    <Html>
      <Head />
      <Preview>ยืนยันการจองสินค้า - เลขที่ใบจอง {data.orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>ยืนยันการจองสินค้า</Heading>
            <Text style={orderNumber}>เลขที่ใบจอง: {data.orderNumber}</Text>
            <Text style={dateText}>{orderDate}</Text>
          </Section>

          {/* Thank You Message */}
          <Section style={section}>
            <Text style={text}>
              <strong>เรียน</strong> {displayName}
            </Text>
            <Text style={text}>
              ขอบพระคุณที่ไว้วางใจใช้บริการของเรา 
              ระบบได้รับคำสั่งจองของท่านเรียบร้อยแล้ว
              และอยู่ระหว่างการตรวจสอบโดยเจ้าหน้าที่
            </Text>
          </Section>

          <Hr style={{
          border: 'none',
          borderTop: '1px solid #e5e7eb',
          margin: '24px 0',
        }} />

          {/* Order Summary */}
          <Section style={section}>
            <Heading style={h2}>รายการสินค้าที่จอง</Heading>
            
            {data.orderItems.map((item, index) => (
              <div key={index} style={itemContainer}>
                {/* Main Product */}
                <Row>
                  <Column style={{ width: '80px' }}>
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
                  <Column style={{ paddingLeft: '16px' }}>
                    <Text style={productName}>{item.productName}</Text>
                    <Text style={quantityText}>
                      จำนวน: <strong>{item.mainQuantity}</strong> หน่วย
                    </Text>
                    {item.pairedProducts && item.pairedProducts.length > 0 && (
                      <Text style={pairedBadge}>
                        พร้อมสินค้าที่ใช้ร่วมกัน {item.pairedProducts.length} รายการ
                      </Text>
                    )}
                  </Column>
                </Row>

                {/* Paired Products */}
                {item.pairedProducts && item.pairedProducts.length > 0 && (
                  <div style={pairedContainer}>
                    <Text style={pairedTitle}>สินค้าที่ใช้ร่วมกัน:</Text>
                    {item.pairedProducts.map((paired, pIndex) => (
                      <Row key={pIndex} style={pairedItemRow}>
                        <Column style={{ width: '44px' }}>
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
                        <Column style={{ paddingLeft: '10px', verticalAlign: 'middle' as const }}>
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
           <Hr style={{
            border: 'none',
             borderTop: '1px solid #e5e7eb',
            margin: '8px 0px',
            }} />
            <Row>
              <Column>
                <Text style={totalLabel}>จำนวนรวม:</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{data.totalQuantity} หน่วย</Text>
              </Column>
            </Row>
          </Section>

          

          {/* Customer Info */}
          <Section style={section}>
            <Heading style={h2}>ข้อมูลผู้จอง</Heading>
            <Text style={infoText}>
              <strong>ชื่อ-นามสกุล:</strong> {data.customerName}
            </Text>
            {data.customerNickname && (
              <Text style={infoText}>
                <strong>ชื่อเล่น:</strong> {data.customerNickname}
              </Text>
            )}
            <Text style={infoText}>
              <strong>อีเมล:</strong> {data.customerEmail}
            </Text>
            <Text style={infoText}>
              <strong>หมายเลขโทรศัพท์:</strong> {data.customerPhone}
            </Text>
          </Section>

          {/* Shipping Address */}
          {data.shippingAddress && (
            <>
              <Hr style={{
            border: 'none',
            borderTop: '1px solid #e5e7eb',
            margin: '24px 0',
           }} />
              <Section style={section}>
                <Heading style={h2}>ที่อยู่สำหรับจัดส่ง</Heading>
                {data.shippingResidenceType && (
                  <Text style={infoText}>
                    <strong>ประเภทที่อยู่อาศัย:</strong> {data.shippingResidenceType}
                  </Text>
                )}
                <Text style={infoText}>{data.shippingAddress}</Text>
                {data.shippingSubDistrict && (
                  <Text style={infoText}>
                    {data.shippingSubDistrict}
                    {data.shippingDistrict && ` ${data.shippingDistrict}`}
                  </Text>
                )}
                {data.shippingProvince && (
                  <Text style={infoText}>
                    {data.shippingProvince}{' '}
                    {data.shippingPostalCode && data.shippingPostalCode}
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
                <Heading style={h2}>หมายเหตุ</Heading>
                <Text style={noteText}>{data.customerNote}</Text>
              </Section>
            </>
          )}

        <Hr style={{
          border: 'none',
          borderTop: '1px solid #e5e7eb',
          margin: '24px 0',
        }} />

          {/* Next Steps */}
          <Section style={section}>
            <Heading style={h2}>ขั้นตอนถัดไป</Heading>
            <Text style={stepText}>
              <strong>1.</strong> เจ้าหน้าที่จะดำเนินการตรวจสอบรายการจองของท่าน
            </Text>
            <Text style={stepText}>
              <strong>2.</strong> เจ้าหน้าที่จะติดต่อกลับ เพื่อแจ้งรายละเอียดให้ท่านทราบ
            </Text>
            <Text style={stepText}>
              <strong>3.</strong> ท่านสามารถตรวจสอบสถานะคำสั่งจองได้ตลอดเวลา
              ผ่านระบบออนไลน์
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Link href={orderUrl} style={button}>
              ตรวจสอบรายละเอียดคำสั่งจอง
            </Link>
          </Section>

          {/* Footer */}
          
          <Section style={footer}>
            <Text style={footerText}>
              <strong>ติดต่อสอบถาม</strong>
              <br />
              หมายเลขโทรศัพท์: 081-694-2896
              <br />
              เวลาทำการ: จันทร์-เสาร์ เวลา 08:30-17:30 น.
            </Text>
            <Text style={footerText}>
              อีเมลฉบับนี้ส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ
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
  backgroundColor: '#f97316',
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

const orderNumber = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
}

const dateText = {
  color: '#fed7aa',
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
  borderBottom: '2px solid #f97316',
  paddingBottom: '8px',
}

const text = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const stepText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
  paddingLeft: '8px',
}

const itemContainer = {
  padding: '16px',
  backgroundColor: '#fafafa',
  borderRadius: '6px',
  marginBottom: '12px',
  border: '1px solid #e5e7eb',
}

const productImage = {
  width: '80px',
  height: '80px',
  objectFit: 'cover' as const,
  borderRadius: '6px',
  border: '1px solid #e5e7eb',
}

const noImage = {
  width: '80px',
  height: '80px',
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  color: '#9ca3af',
  border: '1px solid #e5e7eb',
}

const productName = {
  color: '#111827',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 6px',
}

const quantityText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px',
}

const pairedBadge = {
  color: '#d97706',
  fontSize: '12px',
  fontWeight: '500',
  margin: '4px 0 0',
  backgroundColor: '#fef3c7',
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-block',
}

const pairedContainer = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #e5e7eb',
}

const pairedTitle = {
  color: '#6b7280',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const pairedItemRow = {
  marginBottom: '8px',
  backgroundColor: '#f9fafb',
  borderRadius: '4px',
  padding: '6px',
}

const pairedProductImage = {
  width: '44px',
  height: '44px',
  objectFit: 'cover' as const,
  borderRadius: '4px',
  border: '1px solid #e5e7eb',
}

const pairedNoImage = {
  width: '44px',
  height: '44px',
  backgroundColor: '#e5e7eb',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  color: '#9ca3af',
}

const pairedItemName = {
  color: '#374151',
  fontSize: '13px',
  fontWeight: '500',
  margin: '0 0 2px',
}

const pairedItemQty = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
}

const summaryBox = {
  padding: '20px 32px',
  backgroundColor: '#fff7ed',
  borderRadius: '6px',
  marginTop: '24px',
  border: '1px solid #fed7aa',
}

const summaryLabel = {
  color: '#78350f',
  fontSize: '14px',
  margin: '6px 0',
  fontWeight: '500',
}

const summaryValue = {
  color: '#78350f',
  fontSize: '14px',
  fontWeight: '600',
  margin: '6px 0',
}

const totalLabel = {
  color: '#78350f',
  fontSize: '16px',
  fontWeight: '600',
  margin: '8px 0',
}

const totalValue = {
  color: '#78350f',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const infoText = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const noteText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  borderLeft: '3px solid #f97316',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  padding: '0 32px',
}

const button = {
  backgroundColor: '#f97316',
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

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 32px',
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

export default OrderConfirmationEmail