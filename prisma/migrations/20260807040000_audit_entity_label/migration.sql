-- ชื่อที่คนอ่านออกของสิ่งที่ถูกแก้ (เลขที่เอกสาร / ชื่อสินค้า / อีเมล)
-- เก็บ ณ ตอนบันทึก เพราะของที่ถูกลบไปแล้ว join กลับไปหาชื่อไม่ได้
ALTER TABLE "AuditLog" ADD COLUMN "entityLabel" TEXT;

-- ใช้กับช่องค้นหาในหน้า /admin/audit-log
CREATE INDEX "AuditLog_entityLabel_idx" ON "AuditLog"("entityLabel");

-- pg_trgm ติดตั้งไว้แล้วตอนทำ full-text ของสินค้า — ใช้ต่อได้เลย
-- ช่วยให้ค้นบางส่วนของเลขที่เอกสาร ("0807-001") ไม่ต้องพิมพ์เต็ม
CREATE INDEX "AuditLog_entityLabel_trgm_idx" ON "AuditLog" USING GIN ("entityLabel" gin_trgm_ops);
