# บันทึกสำหรับ Claude Code

ไฟล์นี้เก็บเฉพาะสิ่งที่ **อ่านจากโค้ดแล้วไม่รู้** — กับดักที่เคยทำให้เสียเวลาจริง
และการตัดสินใจที่ตั้งใจทำ ไม่ใช่ของที่ผิด ส่วนภาพรวมโปรเจกอยู่ใน `README.md`
และกฎการเขียนโค้ดอยู่ใน `CONTRIBUTING.md`

---

## กับดักที่เคยเสียเวลาจริง

### `role === "admin"` — ห้ามเทียบตรงๆ

ตอนเพิ่ม `superadmin` เข้า enum พบว่ามี **17 จุด** ที่เทียบแบบนี้ ถ้าเพิ่มค่า
โดยไม่แก้ทุกจุด superadmin จะถูกปฏิเสธหมด — ล็อกอินหลังบ้านไม่ได้ middleware
เด้งออก guard คืน 403

ใช้ `isAdminRole()` / `isSuperAdminRole()` จาก `src/lib/roles.ts` เสมอ

### `server-only` ใน `lib/db.ts`

กันไม่ให้ client component ลาก Prisma เข้าบันเดิลเบราว์เซอร์ (เคยเกิดจริงกับหน้า
`/admin/audit-log` ที่ import ป้ายภาษาไทยจาก `lib/audit` แล้วพังตอนเปิดหน้า)

ผลข้างเคียงสองอย่างที่ต้องรู้:

- **ค่าคงที่ที่ทั้งสองฝั่งต้องใช้ ต้องอยู่ไฟล์แยกที่ไม่ import อะไรจาก server**
  ดูตัวอย่าง `src/lib/audit-actions.ts` และ `src/lib/roles.ts`
- **สคริปต์ `tsx` ที่ import `lib/db` จะพัง** — ถ้าต้องเขียนสคริปต์ชั่วคราวคุยกับ DB
  ให้ `new PrismaClient()` เองแบบที่ `prisma/seed.ts` ทำ หรือใช้
  `docker exec ninebooking-db psql` ตรงๆ
- Vitest alias `server-only` ไปที่ stub ว่าง (`src/test/server-only-stub.ts`)
  ดู `vitest.config.ts`

### Prisma `findMany({ distinct })` ไม่มี LIMIT

ดัก SQL จริงแล้วได้ `SELECT id, actorId FROM "AuditLog" WHERE 1=1 ORDER BY id OFFSET $1`
— `distinct` กับ `take` ถูกทำในหน่วยความจำ **หลัง** ดึงมาแล้ว แปลว่าขนทั้งตาราง
มาทุกครั้ง ใช้ `groupBy` แทนซึ่งถูกแปลเป็น `GROUP BY` จริง

### migration ที่ Prisma generate ให้ ทำข้อมูลหาย

`prisma migrate diff` สร้าง `DROP COLUMN` แล้ว `ADD COLUMN` ใหม่สำหรับการเปลี่ยน
ชนิด/enum และสร้าง `ADD COLUMN ... NOT NULL` ที่ไม่มี `DEFAULT` (พังทันทีบนตาราง
ที่ไม่ว่าง)

**ให้เขียน migration เองเสมอเมื่อแตะชนิดข้อมูลหรือ enum** — ใช้ `USING` แปลงค่า
และใส่ `DEFAULT` ตอน `ADD COLUMN` แล้วค่อย `DROP DEFAULT`
ดูตัวอย่างที่ `20260807000000_security_and_document_counters` และ `20260807010000_schema_cleanup`

### `prisma migrate diff --exit-code` รายงาน drift ตลอด

เพราะ `Product.searchVector` เป็น `GENERATED ALWAYS` และมี index `gin_trgm_ops`
ซึ่ง Prisma อธิบายใน schema ไม่ได้ **CI จึงไม่มีด่าน drift โดยเจตนา** (มีคอมเมนต์
อธิบายไว้ใน `.github/workflows/ci.yml`)

### Playwright

- **เบราว์เซอร์ไม่ได้มากับ `npm install`** — ต้อง `npm run e2e:setup` ก่อน
- `toHaveURL(/\/admin/)` **ผ่านตั้งแต่ยังอยู่ที่ `/admin/login`** เทสต์จะดูเหมือนผ่าน
  แล้วไปตายตอนเรียก API ใช้ `/\/admin$/`
- `getByLabel(/รหัสผ่าน/i)` เจอสองตัว เพราะปุ่มสลับมองเห็นมี `aria-label="แสดงรหัสผ่าน"`
  ใช้ `exact: true` (helper `fillCredentials` ใน `e2e/helpers.ts` จัดการให้แล้ว)
- หน้ารายการคำสั่งจอง**ไม่ได้ห่อด้วย `<main>`** และกระดิ่งแจ้งเตือนบน navbar
  ก็มีลิงก์ `/orders/<id>` อยู่ก่อนในลำดับ DOM — เลี่ยงการคลิกทะลุหน้าใน smoke test

---

## การตัดสินใจที่ตั้งใจ — อย่า "แก้" ให้

| เรื่อง                                                              | ทำไม                                                                                                                                                                          |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ธีมเข้มอย่างเดียว ไม่มี light theme**                             | เคยมีโทเคน `:root` ชุดสว่างแต่ไม่มี `ThemeProvider` เลย = dead code ถอน `next-themes` ออกแล้ว คลาส `dark` ที่ `<html>` ยังต้องอยู่เพราะ shadcn/ui มี utility `dark:` ในตัวเอง |
| **ไม่มี sitemap / OG / `robots` เป็น disallow ทั้งหมด**             | catalogue อยู่หลังการล็อกอิน Googlebot ได้แค่ redirect ไปหน้า login — SEO ทั้งชุดไม่มีวันได้ผล                                                                                |
| **ไม่มีปุ่มล้าง audit log**                                         | ถ้าแอดมินลบร่องรอยตัวเองได้ในคลิกเดียว บันทึกทั้งหมดก็เชื่อถือไม่ได้ มี retention 365 วันอัตโนมัติแทน                                                                         |
| **catalogue ต้องล็อกอินก่อน**                                       | เจ้าของโปรเจกเลือกเอง (ระบบภายในแบบ B2B)                                                                                                                                      |
| **`exceljs` ยังมีช่องโหว่ระดับกลางค้างอยู่**                        | วิธีแก้ที่ npm เสนอคือถอย `exceljs` ลง 3.4.0 (ข้าม major กลับหลัง) ไม่คุ้ม เพราะไม่ได้ส่ง buffer จากผู้ใช้เข้า `uuid`                                                         |
| **สีใน `config/pdf-theme.ts` และ `config/chart-theme.ts` เป็น hex** | เรนเดอร์นอกเบราว์เซอร์ / ส่งผ่าน prop จึงใช้ CSS variable ไม่ได้                                                                                                              |

---

## คำสั่งตรวจก่อน commit

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
npx playwright test    # ต้อง build ก่อน และ DB ต้องถูก seed แล้ว
```

**อ่านผลให้ครบ อย่า `tail -3`** — เคยรายงานว่าเทสต์ผ่านทั้งที่พังอยู่ เพราะบรรทัดสรุป
ถูกตัดทิ้ง ให้ `grep -E "Test Files|Tests "` แทน

`npm run build` พิมพ์ตารางเส้นทางท้ายสุด การเอา `| grep` ต่อท้ายทำให้ exit code
มาจาก grep ไม่ใช่ build — ถ้าจะเช็คว่าผ่านไหมให้ดู `Failed to type check` หรือ
`Build error` ตรงๆ

---

## สภาพแวดล้อมของเครื่องนี้

- **ฐานข้อมูลอยู่พอร์ต 5433** ไม่ใช่ 5432 (เครื่องมี Postgres ตัวอื่นจองไว้)
  ตั้งผ่าน `DB_PORT` ใน `.env`
- **Docker Desktop ดับบ่อย** — ถ้า query พังให้ `docker compose up -d` ก่อน
- **Browser pane ใช้ไม่ได้ในสภาพแวดล้อมนี้** screenshot timeout เสมอ
  → **การตรวจหน้าตาเป็นงานของเจ้าของโปรเจก** ฝั่ง Claude ยืนยันได้แค่ผ่าน
  typecheck / build / เทสต์ / query ตรงกับฐานข้อมูล **อย่าอ้างว่า "ดูแล้วสวยดี"**
- เจ้าของโปรเจกคุมโควตารายสัปดาห์อยู่ — งานที่ต้องวนหลายรอบ (เช่นไล่แก้ selector
  ของ e2e) ให้ประเมินราคาก่อนแล้วถามว่าจะทำเองหรือให้เขารันแล้วส่ง error มา

---

## บทเรียนเรื่องวิธีทำงาน (เคยพลาดจริง)

- **อย่าใส่ regex หรือ escape sequence ผ่าน Python heredoc** — `split("\\n")`
  กลายเป็นขึ้นบรรทัดใหม่จริงจนไฟล์พัง เกิดสองครั้งแล้ว ใช้ Write tool เขียนไฟล์ตรงๆ
- **อย่าเขียนสคริปต์ไล่ลบอัตโนมัติกับ destructuring** — สคริปต์ลบตัวแปรที่ไม่ได้ใช้
  เปลี่ยน `const { data: session, status }` เป็น `const { data: status }` และ
  `const [total, setTotal] = useState(0)` เป็น `const [setTotal] = useState(0)`
  ซึ่ง typecheck จับไม่ได้ทุกกรณี (เลยถอด `noUnusedLocals` ออกจาก tsconfig)
- **แก้ทีละอย่างแล้ว verify** โดยเฉพาะเวลาแตะหลายไฟล์พร้อมกันด้วยสคริปต์

---

## งานที่ยกไว้ (ไม่มีอะไรบล็อก)

**หน้า audit log** — cursor pagination แทน offset · เลิกนับจำนวนแบบเป๊ะ
(`count()` เป็น O(n)) · ค้นใน `before`/`after` ที่เป็น JSONB · partition ตามเดือน ·
export CSV → รอจนเริ่มหน่วงจริง

**PDF** — `quotations/[id]/preview` (276 บรรทัด) และ `orders/[id]/quotation`
(691 บรรทัด) ยังมี `StyleSheet` ของตัวเอง ตัวหลังรับข้อมูลจาก `order` ไม่ใช่
`quotation` จึงไม่ใช่การรวมแบบก๊อปวาง ต้องนิยาม input กลาง + mapper สองตัว
→ **รอจนเปิดดู PDF ที่ออกมาได้** เพราะแก้ layout 967 บรรทัดโดยไม่เห็นผลลัพธ์เสี่ยงเกินไป

**`middleware` → `proxy`** — Next 16.3 เตือนว่า convention เดิมจะถูกแทน
ยังใช้ได้ปกติ มี codemod ให้ (`npx @next/codemod@canary middleware-to-proxy .`)
