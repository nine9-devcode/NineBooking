import { defineConfig, devices } from "@playwright/test"

/**
 * เทสต์ end-to-end แบบ smoke — ครอบเส้นทางหลักที่ถ้าพังแล้วเว็บใช้ไม่ได้เลย
 *
 * ต้องมีฐานข้อมูลที่ seed แล้ว (npm run setup) เพราะสเปกใช้บัญชีตัวอย่าง
 * จาก prisma/seed.ts ตรงๆ
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // ใช้ฐานข้อมูลร่วมกัน จึงรันทีละไฟล์
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    locale: "th-TH",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
