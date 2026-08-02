import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // หน้าที่ต้องล็อกอินหรือเป็นข้อมูลส่วนตัว ไม่ควรถูก index
        disallow: [
          "/admin/",
          "/api/",
          "/cart/",
          "/checkout/",
          "/orders/",
          "/profile/",
          "/complete-profile/",
          "/reset-password/",
          "/maintenance/",
          "/support/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
