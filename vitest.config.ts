import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    // รับทั้ง .ts และ .tsx — ของเดิมจับแค่ .ts จึงเขียนเทสต์ component ไม่ได้เลย
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/features/**"],
      exclude: ["**/*.test.*", "**/components/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // lib/db.ts ใส่ import "server-only" ไว้กันไม่ให้ client component ลาก
      // Prisma เข้าบันเดิลเบราว์เซอร์ แต่ Vitest ไม่ใช่บันเดิลเบราว์เซอร์
      // ถ้าไม่ปิดตรงนี้ เทสต์ของโมดูลที่แตะ db จะพังทั้งที่ไม่ได้ผิดอะไร
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
})
