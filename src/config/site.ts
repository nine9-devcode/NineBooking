/**
 * ค่ากลางของเว็บ — แก้ที่เดียวแล้วมีผลทั้ง metadata, sitemap, robots, manifest, อีเมล
 * ค่าที่ผู้ดูแลระบบแก้ได้จากหน้า admin จะอยู่ในตาราง SeoSettings และทับค่าตรงนี้
 */
export const siteConfig = {
  name: "NineBooking",
  shortName: "NineBooking",
  title: "NineBooking — ระบบจองสินค้าออนไลน์",
  description:
    "ระบบจองสินค้าออนไลน์พร้อมหลังบ้านครบวงจร: จัดการสินค้า/หมวดหมู่, ตะกร้า, ใบจอง, ใบเสนอราคา PDF, แจ้งปัญหา และรายงานสรุป",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "th_TH",
  themeColor: "#0d1220",
  keywords: [
    "ระบบจองสินค้า",
    "booking system",
    "ใบเสนอราคา",
    "Next.js",
    "Prisma",
    "PostgreSQL",
  ],
  author: "nine9-devcode",
  repository: "https://github.com/nine9-devcode/NineBooking",
} as const

export type SiteConfig = typeof siteConfig
