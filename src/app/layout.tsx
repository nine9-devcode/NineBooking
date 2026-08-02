import type { Metadata, Viewport } from "next"
import { Prompt, Noto_Sans_Thai } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { siteConfig } from "@/config/site"
import SessionProvider from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/features/cart/cart-context"
import { prisma } from "@/lib/db"

// Prompt = หัวข้อ, Noto Sans Thai = เนื้อหา
const prompt = Prompt({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  display: "swap",
})

const notoSansThai = Noto_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-noto-sans-thai",
  display: "swap",
})

/**
 * ค่า SEO แก้ได้จากหน้า admin — ถ้ายังไม่เคยตั้งจะใช้ค่าจาก siteConfig
 * ห่อ try/catch ไว้เพราะ layout ต้อง render ได้แม้ยังไม่ได้ migrate ฐานข้อมูล
 */
async function getSeoSettings() {
  try {
    return await prisma.seoSettings.findFirst()
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings()

  const siteTitle = settings?.siteTitle || siteConfig.title
  const siteDescription = settings?.siteDescription || siteConfig.description
  const ogImage = settings?.ogImage || `${siteConfig.url}/brand/og-image.png`

  return {
    metadataBase: new URL(siteConfig.url),

    title: {
      default: siteTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteDescription,
    keywords: [...siteConfig.keywords],

    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    manifest: "/manifest.webmanifest",

    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: siteTitle,
      description: siteDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteTitle }],
    },

    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [ogImage],
    },

    category: "technology",

    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": siteConfig.shortName,
      "format-detection": "telephone=no",
    },
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: siteConfig.themeColor,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSeoSettings()
  const gaId = settings?.googleAnalyticsId

  return (
    // ธีมเข้มเป็นค่าเริ่มต้น — ปุ่มสลับใน navbar จะเปลี่ยน class นี้
    <html lang="th" className="dark" suppressHydrationWarning>
      <body
        className={`${notoSansThai.variable} ${prompt.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <CartProvider>
            {children}
            <Toaster position="bottom-right" />
          </CartProvider>
        </SessionProvider>

        {/* Google Analytics ใส่ผ่านหน้า admin ได้ ไม่ใส่ก็ไม่โหลดสคริปต์ */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
