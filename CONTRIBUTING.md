# การร่วมพัฒนา

## เริ่มต้น

```bash
cp .env.example .env
npm install
npm run setup     # ยกฐานข้อมูลด้วย docker + migrate + ใส่ข้อมูลตัวอย่าง
npm run dev
```

บัญชีสำหรับทดลอง (สร้างโดย `prisma/seed.ts`)

| บทบาท        | อีเมล                   | รหัสผ่าน     | เข้าที่        |
| ------------ | ----------------------- | ------------ | -------------- |
| ผู้ดูแลระบบ  | `admin@ninebooking.dev` | `Admin@1234` | `/admin/login` |
| ผู้ใช้ทั่วไป | `demo@ninebooking.dev`  | `Demo@1234`  | `/login`       |

## ก่อนเปิด PR

```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

## หลักที่ยึด

- **`src/app/` มีแต่เส้นทาง** — ตรรกะที่ยาวกว่าไม่กี่บรรทัดควรอยู่ใน `src/features/*/`
  หรือ `src/lib/`
- **Zod schema ใช้ชุดเดียวกันทั้งฟอร์มและ API** — ดูตัวอย่างที่
  `src/features/auth/schema.ts`
- **สีมาจากโทเคนเสมอ** — ห้ามเขียน `bg-gray-800` หรือ `#1f2937` ตรงๆ
  ยกเว้นไฟล์ที่ระบุไว้ใน `src/config/pdf-theme.ts` และ `src/config/chart-theme.ts`
  ซึ่งเรนเดอร์นอกเบราว์เซอร์จึงใช้ CSS variable ไม่ได้
- **แก้ `schema.prisma` ต้องมี migration มาด้วย** — CI ตรวจว่าสองอย่างนี้ตรงกัน
- **คอมเมนต์อธิบายว่า "ทำไม" ไม่ใช่ "ทำอะไร"** — โค้ดบอกว่าทำอะไรอยู่แล้ว
