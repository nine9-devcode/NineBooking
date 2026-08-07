import type { MetadataRoute } from "next"

/**
 * บอก crawler ว่าไม่ต้องเก็บอะไรจากเว็บนี้
 *
 * ระบบนี้เป็นระบบภายในแบบ B2B — ทั้งรายการสินค้าและหน้าสินค้ารายตัวอยู่หลัง
 * การล็อกอิน (ดู middleware.ts และ api/products) สิ่งที่ Googlebot จะได้
 * มีแค่การ redirect ไปหน้า login เท่านั้น
 *
 * เดิม robots.ts ตั้ง allow: "/" และมี sitemap.ts ที่ปล่อย URL สินค้าทุกตัวออกไป
 * พร้อม OG/Twitter card ครบชุด ซึ่งเป็นงานที่ไม่มีวันได้ผลเลย จึงถอดออก
 * ถ้าวันไหนเปิดให้ดู catalogue ได้โดยไม่ต้องล็อกอิน ค่อยกลับมาเปิดใหม่
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  }
}
