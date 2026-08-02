import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"
import { prisma } from "@/lib/db"

/**
 * รายการสินค้า/หมวดหมู่มาจากฐานข้อมูล ซึ่งอาจยังไม่พร้อมตอน build
 * (เช่น ตอน CI หรือคนที่เพิ่งโคลน repo มายังไม่ได้ migrate)
 * จึงต้องล้มเหลวแบบไม่พังทั้ง build — ปล่อยให้ sitemap มีแค่หน้าคงที่ไปก่อน
 */
async function safeFetch<T>(query: () => Promise<T[]>): Promise<T[]> {
  try {
    return await query()
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url

  const [products, categories] = await Promise.all([
    safeFetch(() =>
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      })
    ),
    safeFetch(() =>
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      })
    ),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // หมวดหมู่แสดงผ่าน query string บนหน้าแรก
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/?category=${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}
