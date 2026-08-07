// ไฟล์: lib/seo.ts
// Helper functions สำหรับ generate SEO metadata

import { Metadata } from 'next'

import { siteConfig } from '@/config/site'
import { prisma } from '@/lib/db'

// ===== Site config: ค่าใน DB (แก้จากหน้า admin) ทับค่าตั้งต้นใน config/site =====
export async function getSiteConfig() {
  const settings = await prisma.seoSettings.findFirst().catch(() => null)

  return {
    name: siteConfig.name,
    title: settings?.siteTitle || siteConfig.title,
    description: settings?.siteDescription || siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
    ogImage: settings?.ogImage ?? null,
  }
}

// ===== Types =====
interface ProductSeoData {
  name: string
  subtitle?: string | null
  description?: string | null
  image?: string | null
  category?: {
    name: string
  }
}

// ===== Helper: Strip HTML tags =====
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '') // ลบ HTML tags
    .replace(/&nbsp;/g, ' ') // แปลง &nbsp;
    .replace(/&amp;/g, '&')  // แปลง &amp;
    .replace(/&lt;/g, '<')   // แปลง &lt;
    .replace(/&gt;/g, '>')   // แปลง &gt;
    .replace(/\s+/g, ' ')    // รวม whitespace
    .trim()
}

// ===== Helper: Truncate text =====
export function truncate(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

/**
 * metadata ของหน้าสินค้า — มีแค่ title กับ description สำหรับแท็บเบราว์เซอร์
 *
 * ไม่มี Open Graph / Twitter card / canonical แล้ว เพราะหน้าสินค้าอยู่หลังการ
 * ล็อกอิน คนที่แชร์ลิงก์ไปจะไม่มีใครเห็นการ์ดพวกนั้นอยู่ดี (ดู app/robots.ts)
 */
export function generateProductMetadata(product: ProductSeoData, _slug: string): Metadata {
  let description = ""

  if (product.subtitle) {
    description = product.subtitle
  } else if (product.description) {
    description = truncate(stripHtml(product.description), 160)
  }

  if (!description) {
    description = `${product.name} - สินค้า${product.category?.name ?? "ทั่วไป"} พร้อมจองออนไลน์`
  }

  return { title: product.name, description }
}
