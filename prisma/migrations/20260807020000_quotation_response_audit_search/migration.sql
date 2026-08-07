-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedNote" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===================================================================
-- ค้นหาสินค้าด้วย full-text ของ Postgres
--
-- ของเดิมเป็น `contains` + mode: insensitive ซึ่ง Prisma แปลเป็น ILIKE '%…%'
-- นั่นคือ sequential scan ทั้งตารางทุกครั้ง ไม่มี index ช่วยได้เลย
-- ไม่มีการจัดอันดับความเกี่ยวข้อง และพิมพ์ผิดตัวเดียวก็หาไม่เจอ
--
-- ใช้สองตัวช่วยคู่กัน:
--   1. tsvector + GIN  → ค้นแบบคำเต็ม พร้อมคะแนนความเกี่ยวข้อง
--   2. pg_trgm + GIN   → ทนคำสะกดผิดและค้นบางส่วนของคำ
--
-- ใช้ dictionary 'simple' เพราะ Postgres ไม่มีตัวตัดคำภาษาไทย
-- ('simple' ไม่ตัดรากศัพท์ แค่แปลงเป็นตัวพิมพ์เล็กแล้วแยกด้วยช่องว่าง
--  ซึ่งเหมาะกับชื่อรุ่นสินค้าอย่าง "IN-600 Pro" มากกว่า dictionary ภาษาอังกฤษ)
-- ===================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- คอลัมน์คำนวณอัตโนมัติ ไม่ต้องมี trigger คอยอัปเดต
ALTER TABLE "Product"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("subtitle", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'C')
  ) STORED;

CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");

-- trgm ช่วยตอนพิมพ์ผิดหรือค้นบางส่วน เช่น "กลอง" ควรเจอ "กล้อง"
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Product_subtitle_trgm_idx" ON "Product" USING GIN ("subtitle" gin_trgm_ops);
