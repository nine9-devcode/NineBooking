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

// ===== Generate Product Metadata =====
export function generateProductMetadata(
  product: ProductSeoData,
  slug: string
): Metadata {
  // สร้าง title
  const title = product.name

  // สร้าง description (ใช้ subtitle หรือ description)
  let description = ''
  if (product.subtitle) {
    description = product.subtitle
  } else if (product.description) {
    description = truncate(stripHtml(product.description), 160)
  }
  
  // ถ้าไม่มี description ใช้ default
  if (!description) {
    description = `${product.name} - สินค้า${product.category?.name ?? 'ทั่วไป'} พร้อมจองออนไลน์`
  }

  // URL ของหน้าสินค้า
  const url = `${siteConfig.url}/products/${slug}`

  // รูปภาพ (ใช้รูปสินค้า หรือ default og-image)
  const image = product.image || `${siteConfig.url}/og-image.png`

  return {
    title,
    description,

    // Open Graph
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [image],
    },

    // Canonical URL
    alternates: {
      canonical: url,
    },
  }
}

// ===== Generate Category Metadata (สำหรับอนาคต) =====
export function generateCategoryMetadata(
  categoryName: string,
  slug: string
): Metadata {
  const title = categoryName
  const description = `สินค้าในหมวด${categoryName} - NineBooking`
  const url = `${siteConfig.url}/?category=${slug}`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}