-- ตัวกรอง "การกระทำ" ในหน้า /admin/audit-log เคยเป็น Seq Scan
-- เพราะ index ที่มีขึ้นต้นด้วย entityType หรือ actorId ใช้กับ action ไม่ได้
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
