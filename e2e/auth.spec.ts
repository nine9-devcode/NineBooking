import { expect, test } from "@playwright/test"

const DEMO = { email: "demo@ninebooking.dev", password: "Demo@1234" }
const ADMIN = { email: "admin@ninebooking.dev", password: "Admin@1234" }

test.describe("การเข้าสู่ระบบ", () => {
  test("คนที่ยังไม่ล็อกอินถูกพาไปหน้า login", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("ลูกค้าล็อกอินแล้วเห็นรายการสินค้า", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/อีเมล/i).fill(DEMO.email)
    await page.getByLabel(/รหัสผ่าน/i).fill(DEMO.password)
    await page.getByRole("button", { name: /เข้าสู่ระบบ/ }).click()

    await expect(page).toHaveURL("/", { timeout: 15_000 })
    await expect(page.getByRole("main")).toBeVisible()
  })

  test("รหัสผ่านผิดไม่บอกว่าอีเมลนั้นเป็นแอดมิน", async ({ page }) => {
    // เคยเป็นช่องให้ไล่หาบัญชีแอดมิน — ต้องได้ข้อความเดียวกับอีเมลทั่วไป
    await page.goto("/login")
    await page.getByLabel(/อีเมล/i).fill(ADMIN.email)
    await page.getByLabel(/รหัสผ่าน/i).fill("wrong-password-on-purpose")
    await page.getByRole("button", { name: /เข้าสู่ระบบ/ }).click()

    await expect(page.getByText(/อีเมลหรือรหัสผ่านไม่ถูกต้อง/)).toBeVisible({
      timeout: 15_000,
    })
  })
})
