import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

/** บัญชีจาก prisma/seed.ts */
export const DEMO = { email: "demo@ninebooking.dev", password: "Demo@1234" }
export const ADMIN = { email: "admin@ninebooking.dev", password: "Admin@1234" }

/** slug ของสินค้าที่ seed สร้างไว้เสมอ */
export const SEED_PRODUCT_SLUG = "camera-in-200"

/**
 * ต้องใส่ exact: true
 *
 * ปุ่มสลับการมองเห็นรหัสผ่านมี aria-label ว่า "แสดงรหัสผ่าน" ซึ่งมีคำว่า
 * "รหัสผ่าน" อยู่ข้างใน การค้นแบบ regex จึงเจอสองตัวแล้ว Playwright ปฏิเสธ
 */
export async function fillCredentials(page: Page, email: string, password: string) {
  await page.getByLabel("อีเมล", { exact: true }).fill(email)
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password)
}

export async function login(page: Page, account = DEMO) {
  await page.goto("/login")
  await fillCredentials(page, account.email, account.password)
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click()

  await expect(page).toHaveURL("/", { timeout: 15_000 })
}
