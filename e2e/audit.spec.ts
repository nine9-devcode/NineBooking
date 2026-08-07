import { expect, test } from "@playwright/test"

import { ADMIN, fillCredentials } from "./helpers"

/**
 * เทสต์นี้พิสูจน์ว่า audit log บันทึกจริง ไม่ใช่แค่มีตารางรออยู่
 *
 * ก่อนหน้านี้ประกาศ action ไว้ 18 ตัวแต่ต่อสายจริงแค่ 2 จุด หน้า /admin/audit-log
 * จึงดูโล่งและชวนเข้าใจผิดว่าไม่มีใครทำอะไรในระบบ
 */
test("แอดมินเปลี่ยนการตั้งค่าแล้วมีบันทึกในประวัติการใช้งาน", async ({ page }) => {
  await page.goto("/admin/login")
  await fillCredentials(page, ADMIN.email, ADMIN.password)
  await page.getByRole("button", { name: /เข้าสู่ระบบ/ }).click()
  // ต้องไม่ใช่ /\/admin/ เฉยๆ เพราะ /admin/login ก็เข้าเงื่อนไขนั้น
  // เทสต์จะผ่านตั้งแต่ยังไม่ได้ล็อกอิน แล้วไปตายตอนเรียก API แทน
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })

  // สลับสถานะการเปิดเว็บสองครั้ง เพื่อให้ค่ากลับมาเหมือนเดิมแต่มีบันทึกเกิดขึ้น
  //
  // ยิงจากในหน้าเว็บด้วย page.evaluate ไม่ใช่ page.request เพราะคุกกี้ session
  // ของ NextAuth ต้องถูกส่งไปกับคำขอ ซึ่ง fetch ในบริบทของหน้าทำให้เองอยู่แล้ว
  for (const showHomePage of [false, true]) {
    const status = await page.evaluate(async (value) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showHomePage: value }),
      })
      return res.status
    }, showHomePage)

    expect(status).toBe(200)
  }

  await page.goto("/admin/audit-log")

  await expect(page.getByText("แก้ไขการตั้งค่าระบบ").first()).toBeVisible({
    timeout: 15_000,
  })
  // ต้องแปลเป็นภาษาไทย ไม่ใช่โชว์ชื่อฟิลด์ดิบแบบ "showHomePage: false"
  await expect(page.getByText(/เปิดหน้าเว็บ:/).first()).toBeVisible()
})
