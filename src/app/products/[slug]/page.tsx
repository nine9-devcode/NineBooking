// ไฟล์: app/products/[slug]/page.tsx
//
// Server Component ที่ทำหน้าที่เดียว — ตั้งชื่อแท็บให้เป็นชื่อสินค้าจริง
// ตั้งแต่ HTML ชุดแรก แล้วส่ง slug ต่อให้ client component ไปดึงข้อมูล
//
// ไม่ใช่งาน SEO แม้จะใช้ API ชื่อ generateMetadata — หน้านี้อยู่หลังการล็อกอิน
// crawler จึงเห็นแค่ redirect ไปหน้า login และ robots.ts ก็ disallow ทั้งเว็บ
// (ด้วยเหตุนี้ OG / Twitter card / canonical จึงถูกถอดออกไปแล้ว ดู lib/seo.ts)

import { Metadata } from "next"
import { prisma } from "@/lib/db"
import { generateProductMetadata } from "@/lib/seo"
import { ProductDetail } from "@/features/products/components/product-detail"

// ===== Types =====
interface PageProps {
  params: Promise<{ slug: string }>
}

// ===== Generate Metadata (SEO) =====
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    // ดึงข้อมูลสินค้าสำหรับ SEO
    const product = await prisma.product.findUnique({
      where: {
        slug,
        isActive: true,
      },
      select: {
        name: true,
        subtitle: true,
        description: true,
        image: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    })

    // ถ้าไม่พบสินค้า ใช้ default metadata
    if (!product) {
      return {
        title: "ไม่พบสินค้า",
        description: "สินค้าที่คุณค้นหาไม่มีอยู่ในระบบ",
      }
    }

    // Generate metadata จากข้อมูลสินค้า
    return generateProductMetadata(product, slug)
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "สินค้า",
      description: "รายละเอียดสินค้า",
    }
  }
}

// ===== Page Component =====
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params

  // ส่ง slug ไปให้ Client Component
  return <ProductDetail slug={slug} />
}
