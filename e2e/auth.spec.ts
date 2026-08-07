import { expect, test } from "@playwright/test"

import { ADMIN, fillCredentials, login } from "./helpers"

test.describe("การเข้าสู่ระบบ", () => {
  test("คนที่ยังไม่ล็อกอินถูกพาไปหน้า login", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("ลูกค้าล็อกอินแล้วเข้าหน้าแรกได้", async ({ page }) => {
    await login(page)
    await expect(page.getByRole("main")).toBeVisible()
  })

  test("รหัสผ่านผิดไม่บอกว่าอีเมลนั้นเป็นบัญชีผู้ดูแลระบบ", async ({ page }) => {
    // เคยเป็นช่องโหว่จริง: ระบบเช็ค role ก่อนตรวจรหัสผ่าน คนยิงจึงไล่หาบัญชี
    // แอดมินได้จากข้อความ error โดยไม่ต้องรู้รหัสผ่าน
    await page.goto("/login")
    await fillCredentials(page, ADMIN.email, "wrong-password-on-purpose")
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click()

    // ต้องมีข้อความผิดพลาดโผล่มา (จะเป็น "อีเมลหรือรหัสผ่านไม่ถูกต้อง" หรือ
    // "ถูกล็อคชั่วคราว" ก็ได้ ขึ้นกับว่ารันเทสต์ซ้ำมากี่รอบ)
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 })

    // สิ่งที่ต้องไม่มีคือข้อความที่เผยว่านี่เป็นบัญชีแอดมิน
    await expect(page.getByText("บัญชีผู้ดูแลระบบต้องเข้าสู่ระบบผ่านหน้า")).toHaveCount(0)
  })
})
