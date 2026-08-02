import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // รูปทั้งหมดเก็บในเครื่อง (public/uploads) จึงไม่ต้องอนุญาต remote host ใดๆ
  images: {
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
      {
        // ไฟล์ static ที่ชื่อมี hash อยู่แล้ว แคชยาวได้
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
}

export default nextConfig
