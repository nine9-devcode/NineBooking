-- ทำให้ role เป็น enum แทน String อิสระ
-- แปลงค่าเดิมด้วย USING ไม่ใช่ drop-then-add เพื่อไม่ให้บัญชี admin ที่มีอยู่กลายเป็น user
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (CASE WHEN "role" = 'admin' THEN 'admin' ELSE 'user' END)::"UserRole";

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';

DROP INDEX IF EXISTS "User_role_idx";
CREATE INDEX "User_role_idx" ON "User"("role");

-- ตัวจำกัดอัตราแบบใช้ร่วมกันทุกจุด (แทน LoginRateLimit ที่ผูกกับอีเมลอย่างเดียว)
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimit_blockedUntil_idx" ON "RateLimit"("blockedUntil");

-- ยกการล็อกบัญชีที่ยังมีผลอยู่มาด้วย จะได้ไม่ปลดล็อกให้ใครฟรีๆ ตอน deploy
INSERT INTO "RateLimit" ("key", "count", "windowStart", "blockedUntil", "updatedAt")
SELECT 'login:email:' || "email", "failCount", COALESCE("lastFailedAt", NOW()), "blockedUntil", NOW()
FROM "LoginRateLimit"
WHERE "blockedUntil" IS NOT NULL AND "blockedUntil" > NOW();

DROP TABLE "LoginRateLimit";

-- ตัวนับเลขที่เอกสาร ขอเลขแบบ atomic ในทรานแซกชันเดียวกับที่สร้างเอกสาร
CREATE TABLE "DocumentCounter" (
    "scope" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCounter_pkey" PRIMARY KEY ("scope","period")
);

-- ตั้งค่าเริ่มต้นจากเอกสารที่มีอยู่แล้ว ไม่งั้นเลขจะวนกลับไปชนของเก่า
INSERT INTO "DocumentCounter" ("scope", "period", "value", "updatedAt")
SELECT 'ORDER', SUBSTRING("orderNumber" FROM 5 FOR 8), MAX(CAST(SUBSTRING("orderNumber" FROM 14 FOR 3) AS INTEGER)), NOW()
FROM "Order"
WHERE "orderNumber" ~ '^ORD-[0-9]{8}-[0-9]{3}$'
GROUP BY SUBSTRING("orderNumber" FROM 5 FOR 8);

INSERT INTO "DocumentCounter" ("scope", "period", "value", "updatedAt")
SELECT 'ISSUE', SUBSTRING("issueNumber" FROM 5 FOR 4), MAX(CAST(SUBSTRING("issueNumber" FROM 10 FOR 4) AS INTEGER)), NOW()
FROM "ContactIssue"
WHERE "issueNumber" ~ '^ISS-[0-9]{4}-[0-9]{4}$'
GROUP BY SUBSTRING("issueNumber" FROM 5 FOR 4);

INSERT INTO "DocumentCounter" ("scope", "period", "value", "updatedAt")
SELECT 'QUOTATION', SUBSTRING("baseNumber" FROM 4 FOR 4), MAX(CAST(SUBSTRING("baseNumber" FROM 9 FOR 4) AS INTEGER)), NOW()
FROM "Quotation"
WHERE "baseNumber" ~ '^QT-[0-9]{4}-[0-9]{4}$'
GROUP BY SUBSTRING("baseNumber" FROM 4 FOR 4);
