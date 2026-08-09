# รายการ API

ทุกเส้นอยู่ที่ `src/app/api/` โดยโครงสร้างโฟลเดอร์ = เส้นทาง URL
(`src/app/api/admin/orders/[id]/route.ts` → `/api/admin/orders/:id`)

**สิทธิ์** ในตารางหมายถึง guard ที่ route นั้นเรียกจาก `src/lib/api/guards.ts`

| ป้าย       | หมายถึง                             |
| ---------- | ----------------------------------- |
| สาธารณะ    | ไม่ต้องล็อกอิน                      |
| ผู้ใช้     | `requireUser()` — ล็อกอินแล้ว       |
| แอดมิน     | `requireAdmin()` — admin/superadmin |
| superadmin | `requireSuperAdmin()`               |

> **middleware ไม่ได้ป้องกัน `/api/**`** — ถูกยกเว้นใน `config.matcher`
> ทุก route จึงตรวจสิทธิ์เองด้วย guard ข้างต้น

รูปแบบคำตอบเป็นแบบเดียวกันทั้งระบบ: สำเร็จตอบข้อมูลตรง ๆ ผิดพลาดตอบ `{ error: string }`
(ดู `src/lib/api/response.ts`)

---

## บัญชีผู้ใช้

| Method  | เส้นทาง                      | สิทธิ์  | ทำอะไร                                        |
| ------- | ---------------------------- | ------- | --------------------------------------------- |
| `*`     | `/api/auth/[...nextauth]`    | สาธารณะ | handler ของ NextAuth (signin/signout/session) |
| `POST`  | `/api/auth/register`         | สาธารณะ | สมัครสมาชิก — จำกัด 5 ครั้ง/ชม.               |
| `POST`  | `/api/auth/check-lock`       | สาธารณะ | ถามว่าบัญชีนี้ถูกล็อกจากการกรอกผิดอยู่ไหม     |
| `POST`  | `/api/auth/forgot-password`  | สาธารณะ | ขอลิงก์ตั้งรหัสผ่านใหม่ — ตอบเหมือนกันทุกกรณี |
| `GET`   | `/api/auth/reset-password`   | สาธารณะ | ตรวจว่า token ยังใช้ได้ไหม (ก่อนโชว์ฟอร์ม)    |
| `POST`  | `/api/auth/reset-password`   | สาธารณะ | ตั้งรหัสผ่านใหม่ด้วย token                    |
| `GET`   | `/api/user/profile`          | ผู้ใช้  | ข้อมูลโปรไฟล์                                 |
| `PATCH` | `/api/user/profile`          | ผู้ใช้  | แก้โปรไฟล์                                    |
| `POST`  | `/api/user/complete-profile` | ผู้ใช้  | กรอกข้อมูลที่ยังขาดหลังสมัคร                  |
| `POST`  | `/api/user/change-password`  | ผู้ใช้  | เปลี่ยนรหัสผ่าน (ต้องใส่รหัสเดิม)             |

## สินค้าและหมวดหมู่ (ฝั่งลูกค้า)

| Method | เส้นทาง                       | สิทธิ์ | ทำอะไร                                |
| ------ | ----------------------------- | ------ | ------------------------------------- |
| `GET`  | `/api/products`               | ผู้ใช้ | รายการสินค้า + ค้นหา + แบ่งหน้า       |
| `GET`  | `/api/products/[slug]`        | ผู้ใช้ | รายละเอียดสินค้า                      |
| `GET`  | `/api/products/[slug]/paired` | ผู้ใช้ | สินค้าที่จับคู่ได้ (exclusive → หมวด) |
| `POST` | `/api/products/[slug]/view`   | ผู้ใช้ | นับยอดเข้าชม (กันซ้ำ 1 ครั้ง/คน/วัน)  |
| `GET`  | `/api/categories`             | ผู้ใช้ | หมวดหมู่ทั้งหมดแบบต้นไม้              |

## ตะกร้า

| Method   | เส้นทาง          | สิทธิ์ | ทำอะไร                   |
| -------- | ---------------- | ------ | ------------------------ |
| `GET`    | `/api/cart`      | ผู้ใช้ | ตะกร้าของผู้ใช้          |
| `POST`   | `/api/cart`      | ผู้ใช้ | เพิ่มสินค้า (+คู่จับ)    |
| `DELETE` | `/api/cart`      | ผู้ใช้ | ล้างทั้งตะกร้า           |
| `PATCH`  | `/api/cart/[id]` | ผู้ใช้ | แก้จำนวน / เปลี่ยนคู่จับ |
| `DELETE` | `/api/cart/[id]` | ผู้ใช้ | ลบรายการเดียว            |

## ใบจอง (ฝั่งลูกค้า)

| Method  | เส้นทาง                          | สิทธิ์ | ทำอะไร                              |
| ------- | -------------------------------- | ------ | ----------------------------------- |
| `POST`  | `/api/orders`                    | ผู้ใช้ | ส่งใบจอง — ทรานแซกชันหลักของระบบ    |
| `GET`   | `/api/orders`                    | ผู้ใช้ | ประวัติใบจองของตัวเอง               |
| `GET`   | `/api/orders/[id]`               | ผู้ใช้ | รายละเอียดใบจอง (ของตัวเองเท่านั้น) |
| `PATCH` | `/api/orders/[id]`               | ผู้ใช้ | ยกเลิก — ได้เฉพาะสถานะ `PENDING`    |
| `GET`   | `/api/orders/[id]/quotation`     | ผู้ใช้ | ใบเสนอราคาฉบับล่าสุดของใบจองนี้     |
| `POST`  | `/api/orders/[id]/quotation`     | ผู้ใช้ | ตอบรับ / ปฏิเสธใบเสนอราคา           |
| `GET`   | `/api/orders/[id]/quotation/pdf` | ผู้ใช้ | ดาวน์โหลดใบเสนอราคาเป็น PDF         |

## แจ้งปัญหาและไฟล์

| Method   | เส้นทาง                | สิทธิ์ | ทำอะไร                                          |
| -------- | ---------------------- | ------ | ----------------------------------------------- |
| `POST`   | `/api/support`         | ผู้ใช้ | ส่งเรื่อง + แนบรูปสูงสุด 3 (จำกัด 10 ครั้ง/ชม.) |
| `GET`    | `/api/support`         | ผู้ใช้ | ประวัติเรื่องที่ตัวเองแจ้ง                      |
| `GET`    | `/api/files/[...path]` | ผู้ใช้ | เปิดไฟล์แนบ — เจ้าของเรื่องหรือแอดมินเท่านั้น   |
| `POST`   | `/api/upload/image`    | แอดมิน | อัปโหลดรูป (ตรวจจาก magic bytes)                |
| `DELETE` | `/api/upload/image`    | แอดมิน | ลบรูป                                           |
| `POST`   | `/api/upload/document` | แอดมิน | อัปโหลดเอกสาร (datasheet)                       |
| `DELETE` | `/api/upload/document` | แอดมิน | ลบเอกสาร                                        |

## กระดิ่งแจ้งเตือน

| Method   | เส้นทาง                                 | สิทธิ์ | ทำอะไร                        |
| -------- | --------------------------------------- | ------ | ----------------------------- |
| `GET`    | `/api/admin/notifications`              | แอดมิน | รายการใบจองใหม่               |
| `PATCH`  | `/api/admin/notifications`              | แอดมิน | ทำเครื่องหมายอ่านทั้งหมด      |
| `DELETE` | `/api/admin/notifications`              | แอดมิน | ล้างรายการ                    |
| `PATCH`  | `/api/admin/notifications/[id]`         | แอดมิน | อ่านทีละรายการ                |
| `GET`    | `/api/admin/notifications/stream`       | แอดมิน | **SSE** ใบจองใหม่แบบเรียลไทม์ |
| `GET`    | `/api/admin/issue-notifications`        | แอดมิน | รายการเรื่องแจ้งปัญหาใหม่     |
| `PATCH`  | `/api/admin/issue-notifications`        | แอดมิน | อ่านทั้งหมด                   |
| `DELETE` | `/api/admin/issue-notifications`        | แอดมิน | ล้างรายการ                    |
| `PATCH`  | `/api/admin/issue-notifications/[id]`   | แอดมิน | อ่านทีละรายการ                |
| `GET`    | `/api/admin/issue-notifications/stream` | แอดมิน | **SSE** เรื่องแจ้งปัญหาใหม่   |
| `GET`    | `/api/user/order-notifications`         | ผู้ใช้ | กระดิ่งสถานะใบจอง (polling)   |
| `POST`   | `/api/user/order-notifications/read`    | ผู้ใช้ | ทำเครื่องหมายอ่าน             |
| `GET`    | `/api/user/support-notifications`       | ผู้ใช้ | กระดิ่งความคืบหน้าเรื่องแจ้ง  |
| `POST`   | `/api/user/support-notifications/read`  | ผู้ใช้ | ทำเครื่องหมายอ่าน             |

## หลังบ้าน — สินค้าและหมวดหมู่

| Method   | เส้นทาง                              | สิทธิ์ | ทำอะไร                    |
| -------- | ------------------------------------ | ------ | ------------------------- |
| `GET`    | `/api/admin/products`                | แอดมิน | รายการ + ค้นหา + แบ่งหน้า |
| `POST`   | `/api/admin/products`                | แอดมิน | เพิ่มสินค้า               |
| `PATCH`  | `/api/admin/products/[id]`           | แอดมิน | แก้ไข                     |
| `DELETE` | `/api/admin/products/[id]`           | แอดมิน | ลบ                        |
| `GET`    | `/api/admin/categories`              | แอดมิน | รายการหมวดหมู่            |
| `POST`   | `/api/admin/categories`              | แอดมิน | เพิ่มหมวด                 |
| `PATCH`  | `/api/admin/categories/[id]`         | แอดมิน | แก้ไข                     |
| `DELETE` | `/api/admin/categories/[id]`         | แอดมิน | ลบ (ห้ามลบถ้ายังมีสินค้า) |
| `PATCH`  | `/api/admin/categories/sort`         | แอดมิน | จัดลำดับการแสดง           |
| `GET`    | `/api/admin/category-pairings`       | แอดมิน | คู่หมวดทั้งหมด            |
| `POST`   | `/api/admin/category-pairings`       | แอดมิน | เพิ่มคู่หมวด              |
| `DELETE` | `/api/admin/category-pairings/[id]`  | แอดมิน | ลบคู่หมวด                 |
| `GET`    | `/api/admin/exclusive-pairings`      | แอดมิน | คู่สินค้าเฉพาะ            |
| `POST`   | `/api/admin/exclusive-pairings`      | แอดมิน | เพิ่มคู่สินค้า            |
| `DELETE` | `/api/admin/exclusive-pairings/[id]` | แอดมิน | ลบคู่สินค้า               |

## หลังบ้าน — ใบจอง

| Method  | เส้นทาง                            | สิทธิ์ | ทำอะไร                                       |
| ------- | ---------------------------------- | ------ | -------------------------------------------- |
| `GET`   | `/api/admin/orders`                | แอดมิน | รายการ + ตัวกรอง + สถิติ                     |
| `GET`   | `/api/admin/orders/[id]`           | แอดมิน | รายละเอียด                                   |
| `PATCH` | `/api/admin/orders/[id]`           | แอดมิน | เปลี่ยนสถานะ (ผ่าน state machine) / หมายเหตุ |
| `PATCH` | `/api/admin/orders/[id]/mark-read` | แอดมิน | ทำเครื่องหมายว่าอ่านแล้ว                     |
| `GET`   | `/api/admin/orders/[id]/pdf`       | แอดมิน | ใบจองเป็น PDF                                |
| `GET`   | `/api/admin/orders/[id]/quotation` | แอดมิน | ใบเสนอราคาที่สร้างจากใบจองนี้เป็น PDF        |
| `GET`   | `/api/admin/orders/export`         | แอดมิน | ส่งออก Excel                                 |
| `GET`   | `/api/admin/orders/export-pdf`     | แอดมิน | ส่งออก PDF                                   |

## หลังบ้าน — ใบเสนอราคา

| Method   | เส้นทาง                              | สิทธิ์ | ทำอะไร                                 |
| -------- | ------------------------------------ | ------ | -------------------------------------- |
| `GET`    | `/api/admin/quotations`              | แอดมิน | รายการ (นับเฉพาะ `isLatest`)           |
| `POST`   | `/api/admin/quotations`              | แอดมิน | ออกใบใหม่จากใบจอง                      |
| `GET`    | `/api/admin/quotations/[id]`         | แอดมิน | รายละเอียด + ทุกเวอร์ชัน               |
| `PATCH`  | `/api/admin/quotations/[id]`         | แอดมิน | แก้ไข — ราคาเปลี่ยนจะสร้างเวอร์ชันใหม่ |
| `DELETE` | `/api/admin/quotations/[id]`         | แอดมิน | ลบ (คืน `isLatest` ให้เวอร์ชันก่อน)    |
| `PATCH`  | `/api/admin/quotations/[id]/status`  | แอดมิน | เปลี่ยนสถานะ (เช่น `DRAFT` → `SENT`)   |
| `GET`    | `/api/admin/quotations/[id]/pdf`     | แอดมิน | PDF ฉบับจริง                           |
| `GET`    | `/api/admin/quotations/[id]/preview` | แอดมิน | PDF ตัวอย่างก่อนส่ง                    |
| `GET`    | `/api/admin/quotation-settings`      | แอดมิน | ข้อมูลบริษัทในหัวเอกสาร                |
| `PATCH`  | `/api/admin/quotation-settings`      | แอดมิน | แก้ข้อมูลบริษัท                        |
| `GET`    | `/api/admin/quotation-sellers`       | แอดมิน | รายชื่อผู้ขาย                          |
| `POST`   | `/api/admin/quotation-sellers`       | แอดมิน | เพิ่มผู้ขาย                            |
| `PATCH`  | `/api/admin/quotation-sellers/[id]`  | แอดมิน | แก้ไข / ตั้งเป็นค่าที่ใช้อยู่          |
| `DELETE` | `/api/admin/quotation-sellers/[id]`  | แอดมิน | ลบ                                     |

## หลังบ้าน — แจ้งปัญหา สมาชิก และรายงาน

| Method   | เส้นทาง                                     | สิทธิ์ | ทำอะไร                         |
| -------- | ------------------------------------------- | ------ | ------------------------------ |
| `GET`    | `/api/admin/contact-issues`                 | แอดมิน | รายการเรื่องแจ้ง + ตัวกรอง     |
| `GET`    | `/api/admin/contact-issues/[id]`            | แอดมิน | รายละเอียด                     |
| `PATCH`  | `/api/admin/contact-issues/[id]`            | แอดมิน | ตอบกลับ / เปลี่ยนสถานะ         |
| `DELETE` | `/api/admin/contact-issues/[id]`            | แอดมิน | ลบ                             |
| `PATCH`  | `/api/admin/contact-issues/[id]/mark-read`  | แอดมิน | ทำเครื่องหมายว่าอ่านแล้ว       |
| `DELETE` | `/api/admin/contact-issues/bulk-delete`     | แอดมิน | ลบหลายรายการ                   |
| `GET`    | `/api/admin/users`                          | แอดมิน | รายชื่อสมาชิก                  |
| `POST`   | `/api/admin/users`                          | แอดมิน | เพิ่มผู้ใช้                    |
| `PATCH`  | `/api/admin/users`                          | แอดมิน | แก้ไขหลายรายการ                |
| `DELETE` | `/api/admin/users`                          | แอดมิน | ลบหลายรายการ                   |
| `GET`    | `/api/admin/users/[id]`                     | แอดมิน | รายละเอียด                     |
| `PATCH`  | `/api/admin/users/[id]`                     | แอดมิน | แก้ไข (ตั้ง superadmin ไม่ได้) |
| `DELETE` | `/api/admin/users/[id]`                     | แอดมิน | ลบ                             |
| `GET`    | `/api/admin/users/export`                   | แอดมิน | ส่งออก Excel                   |
| `GET`    | `/api/admin/users/export-pdf`               | แอดมิน | ส่งออก PDF                     |
| `GET`    | `/api/admin/dashboard/stats`                | แอดมิน | การ์ดสรุปหน้าแรก               |
| `GET`    | `/api/admin/dashboard/recent-orders`        | แอดมิน | ใบจองล่าสุด                    |
| `GET`    | `/api/admin/dashboard/top-products`         | แอดมิน | สินค้ายอดนิยม                  |
| `GET`    | `/api/admin/dashboard/category-stats`       | แอดมิน | สัดส่วนตามหมวดหมู่             |
| `GET`    | `/api/admin/dashboard/yearly-stats`         | แอดมิน | กราฟรายเดือน                   |
| `GET`    | `/api/admin/dashboard/summary-report`       | แอดมิน | ตัวเลขรวมตามช่วงวันที่         |
| `GET`    | `/api/admin/dashboard/summary-report/excel` | แอดมิน | รายงานสรุปเป็น Excel           |
| `GET`    | `/api/admin/dashboard/summary-report/pdf`   | แอดมิน | รายงานสรุปเป็น PDF             |
| `GET`    | `/api/admin/audit-log`                      | แอดมิน | ประวัติการใช้งานระบบ + ตัวกรอง |

## ตั้งค่าระบบและงานเบื้องหลัง

| Method   | เส้นทาง                   | สิทธิ์          | ทำอะไร                                                |
| -------- | ------------------------- | --------------- | ----------------------------------------------------- |
| `GET`    | `/api/settings/home-page` | สาธารณะ         | เว็บเปิดอยู่ไหม — middleware เรียกตัวนี้              |
| `GET`    | `/api/seo-settings`       | สาธารณะ         | ค่า SEO สำหรับ metadata                               |
| `GET`    | `/api/admin/settings`     | แอดมิน          | ค่าระบบ                                               |
| `PATCH`  | `/api/admin/settings`     | แอดมิน          | เปิด/ปิดเว็บชั่วคราว                                  |
| `GET`    | `/api/admin/seo-settings` | แอดมิน          | ค่า SEO                                               |
| `PATCH`  | `/api/admin/seo-settings` | แอดมิน          | แก้ค่า SEO                                            |
| `DELETE` | `/api/admin/seo-settings` | แอดมิน          | ล้างค่ากลับเป็นค่าเริ่มต้น                            |
| `GET`    | `/api/cron`               | Bearer / แอดมิน | รันงานตามเวลาทั้งชุด                                  |
| `POST`   | `/api/cron`               | Bearer / แอดมิน | เหมือนกับ `GET`                                       |
| `GET`    | `/api/admin/dev/status`   | superadmin      | จำนวนแถวของแต่ละตาราง                                 |
| `GET`    | `/api/admin/dev/jobs`     | superadmin      | ดูงานตามเวลาที่มี                                     |
| `POST`   | `/api/admin/dev/jobs`     | superadmin      | สั่งรันงานตามเวลาเอง                                  |
| `POST`   | `/api/admin/dev/cleanup`  | superadmin      | ล้างข้อมูลที่โตเรื่อย ๆ (บันทึกลง audit log ทุกครั้ง) |
