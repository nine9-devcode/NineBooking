import { expect, test } from "@playwright/test"

import { SEED_PRODUCT_SLUG, login } from "./helpers"

test.describe("เส้นทางการจอง", () => {
  test("เปิดหน้าสินค้าแล้วหยิบใส่ตะกร้าได้", async ({ page }) => {
    await login(page)

    // เข้าตรงที่ slug จาก seed แทนการกดลิงก์ในหน้าแรก
    // เพราะชื่อหมวดหมู่ในแถบข้างกับชื่อสินค้าซ้ำคำกัน ทำให้เลือกลิงก์ไม่ชัดเจน
    await page.goto(`/products/${SEED_PRODUCT_SLUG}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

    await page.getByRole("button", { name: "เพิ่มลงตะกร้า" }).first().click()

    await page.goto("/cart")
    await expect(page.getByRole("heading", { name: "ตะกร้าสินค้า" })).toBeVisible()
  })

  test("ดูประวัติการจองของตัวเองได้", async ({ page }) => {
    await login(page)
    await page.goto("/orders")

    await expect(page.getByText(/ORD-/).first()).toBeVisible({ timeout: 15_000 })
  })

  test("เข้าหน้าใบเสนอราคาของคำสั่งจองตัวเองได้", async ({ page }) => {
    await login(page)
    await page.goto("/orders")

    // อ่าน id จาก href ของการ์ดแล้วเข้าตรง แทนการคลิกผ่านหน้ารายการ
    //
    // การคลิกทะลุหน้าเปราะเกินไปที่จะเป็นด่านของ smoke test: กระดิ่งแจ้งเตือน
    // บน navbar ก็มีลิงก์ /orders/<id> เหมือนกัน และหน้ารายการก็ไม่ได้ห่อเนื้อหา
    // ด้วย <main> สิ่งที่เทสต์นี้ต้องพิสูจน์คือหน้าใบเสนอราคาเปิดได้และเจ้าของ
    // เห็นข้อมูลจริง ไม่ใช่ว่าการ์ดกดได้
    const cards = page.locator('a[href^="/orders/"]')
    await expect(cards.first()).toBeAttached({ timeout: 15_000 })

    const href = await cards.last().getAttribute("href")
    expect(href).toBeTruthy()

    await page.goto(`${href}/quotation`)

    // มีใบเสนอราคา (seed สร้างไว้) หรือยังไม่มีก็ได้ ขอแค่หน้าไม่พัง
    await expect(page.getByRole("heading", { name: /QT-|ยังไม่มีใบเสนอราคา/ })).toBeVisible({
      timeout: 15_000,
    })
  })
})
