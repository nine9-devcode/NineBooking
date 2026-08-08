-- เพิ่มค่าใหม่เข้า enum ที่มีอยู่
--
-- ใช้ ADD VALUE ไม่ใช่ที่ Prisma generate ให้ (drop type แล้วสร้างใหม่)
-- เพราะแบบนั้นต้องแปลงคอลัมน์ทั้งตารางและเสี่ยงทำ role เดิมหาย
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'superadmin';
