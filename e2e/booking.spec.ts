import { expect, test } from "@playwright/test"

const DEMO = { email: "demo@ninebooking.dev", password: "Demo@1234" }

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.getByLabel(/อีเมล/i).fill(DEMO.email)
  await page.getByLabel(/รหัสผ่าน/i).fill(DEMO.password)
  await page.getByRole("button", { name: /เข้าสู่ระบบ/ }).click()
  await expect(page).toHaveURL("/", { timeout: 15_000 })
}

test.describe("เส้นทางการจอง", () => {
  test("เปิดหน้าสินค้าแล้วหยิบใส่ตะกร้าได้", async ({ page }) => {
    await login(page)

    await page.getByRole("link", { name: /กล้อง/ }).first().click()
    await expect(page).toHaveURL(/\/products\//)

    await page.getByRole("button", { name: /เพิ่มลงตะกร้า|หยิบใส่ตะกร้า/ }).first().click()

    await page.goto("/cart")
    await expect(page.getByRole("heading", { name: "ตะกร้าสินค้า" })).toBeVisible()
  })

  test("ดูประวัติการจองของตัวเองได้", async ({ page }) => {
    await login(page)
    await page.goto("/orders")

    await expect(page.getByText(/ORD-/).first()).toBeVisible({ timeout: 15_000 })
  })
})
