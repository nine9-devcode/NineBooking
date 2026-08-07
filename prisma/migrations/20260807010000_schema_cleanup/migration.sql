-- ===================================================================
-- ทำความสะอาด schema: enum แทน String, updatedAt ที่ขาด, onDelete ที่สมเหตุผล
--
-- ที่ Prisma generate ให้จะเป็น DROP COLUMN แล้ว ADD COLUMN ใหม่ ซึ่งทิ้งข้อมูลเดิม
-- และ ADD COLUMN ... NOT NULL โดยไม่มี DEFAULT จะพังทันทีถ้าตารางไม่ว่าง
-- ไฟล์นี้เขียนเองเพื่อให้ migrate บนฐานที่มีข้อมูลอยู่แล้วได้จริง
-- ===================================================================

CREATE TYPE "CancelledBy" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "SupportNotificationType" AS ENUM ('RESPONSE', 'IN_PROGRESS', 'CLOSED');

-- ── updatedAt ที่ขาดไป ──
-- ใส่ DEFAULT ตอนเพิ่มเพื่อเติมค่าให้แถวเดิม แล้วค่อยถอด DEFAULT ออก
-- (Prisma จัดการค่าเองด้วย @updatedAt ในระดับ application)
ALTER TABLE "CategoryPairing"         ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ExclusivePairing"        ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "IssueNotification"       ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrderItem"               ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrderNotification"       ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PasswordResetToken"      ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "QuotationItem"           ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UserOrderNotification"   ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "UserSupportNotification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ProductViewSummary"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "CategoryPairing"         ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ExclusivePairing"        ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "IssueNotification"       ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "OrderItem"               ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "OrderNotification"       ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "PasswordResetToken"      ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "QuotationItem"           ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "UserOrderNotification"   ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "UserSupportNotification" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ProductViewSummary"      ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ── String → enum โดยแปลงค่าเดิม ไม่ใช่ทิ้งแล้วสร้างใหม่ ──
ALTER TABLE "Order"
  ALTER COLUMN "cancelledBy" TYPE "CancelledBy"
  USING (CASE WHEN "cancelledBy" IN ('CUSTOMER', 'ADMIN') THEN "cancelledBy" END)::"CancelledBy";

ALTER TABLE "UserOrderNotification"
  ALTER COLUMN "oldStatus" TYPE "OrderStatus" USING "oldStatus"::"OrderStatus",
  ALTER COLUMN "newStatus" TYPE "OrderStatus" USING "newStatus"::"OrderStatus";

ALTER TABLE "UserSupportNotification"
  ALTER COLUMN "notificationType" TYPE "SupportNotificationType"
  USING UPPER("notificationType")::"SupportNotificationType";

-- ── OrderItem.product: Restrict → SetNull ──
-- แถวนี้ snapshot productName/productImage ไว้แล้ว ประวัติจึงยังอ่านออกแม้สินค้าถูกลบ
-- ของเดิมทำให้ลบสินค้าไม่ได้ตลอดกาลถ้าเคยมีคนสั่ง
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pairedProductId_fkey";
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_pairedProductId_fkey"
  FOREIGN KEY ("pairedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── index ตามที่ query จริง ──
-- หน้า "คำสั่งจองของฉัน" กรอง userId + status แล้วเรียงตาม createdAt เสมอ
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- ── ตารางที่ไม่มีใครใช้แล้ว (ถูกแทนด้วย ExclusivePairing + CategoryPairing) ──
ALTER TABLE "ProductCompatibility" DROP CONSTRAINT "ProductCompatibility_compatibleProductId_fkey";
ALTER TABLE "ProductCompatibility" DROP CONSTRAINT "ProductCompatibility_mainProductId_fkey";
DROP TABLE "ProductCompatibility";
