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
    },
  },
})
