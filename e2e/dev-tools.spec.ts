import { expect, test } from "@playwright/test"

import { ADMIN, STAFF, fillCredentials } from "./helpers"

/**
 * เทสต์ชุดนี้พิสูจน์ว่าการกั้นสิทธิ์ระดับ superadmin ทำงานจริง
 *
 * จุดที่ต้องระวังคือแอดมินธรรมดา "ไม่เห็นเมนู" ไม่พอ — ต้องเรียก API ตรงๆ
 * ไม่ได้ด้วย ไม่งั้นการซ่อนเมนูเป็นแค่การตกแต่ง
 */

async function loginAdmin(
  page: import("@playwright/test").Page,
  account: { email: string; password: string }
) {
  await page.goto("/admin/login")
  await fillCredentials(page, account.email, account.password)
  await page.getByRole("button", { name: /เข้าสู่ระบบ/ }).click()
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
}

test("ผู้ดูแลระบบสูงสุดเข้าเครื่องมือระบบได้และเห็นสถานะข้อมูล", async ({ page }) => {
  await loginAdmin(page, ADMIN)

  await page.getByRole("link", { name: "เครื่องมือระบบ" }).click()
  await expect(page).toHaveURL(/\/admin\/dev-tools$/)

  await expect(page.getByRole("heading", { name: "สถานะระบบ" })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText("ประวัติการใช้งาน").first()).toBeVisible()
})

test("สั่งรันงานตามเวลาแล้วมีบันทึกในประวัติการใช้งาน", async ({ page }) => {
  await loginAdmin(page, ADMIN)
  await page.goto("/admin/dev-tools")

  await page.getByRole("button", { name: "รันทั้งหมด" }).click()
  await expect(page.getByText(/เสร็จแล้ว/)).toBeVisible({ timeout: 30_000 })

  await page.goto("/admin/audit-log")
  await expect(page.getByText("สั่งรันงานตามเวลา").first()).toBeVisible({
    timeout: 15_000,
  })
})

test("แอดมินธรรมดาไม่เห็นเมนูและเรียก API ตรงๆ ไม่ได้", async ({ page }) => {
  await loginAdmin(page, STAFF)

  await expect(page.getByRole("link", { name: "เครื่องมือระบบ" })).toHaveCount(0)

  // การซ่อนเมนูไม่ใช่การกั้นสิทธิ์ — ตัวจริงต้องอยู่ที่ API
  const status = await page.evaluate(async () => {
    const res = await fetch("/api/admin/dev/status")
    return res.status
  })
  expect(status).toBe(403)

  const cleanup = await page.evaluate(async () => {
    const res = await fetch("/api/admin/dev/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "rateLimits" }),
    })
    return res.status
  })
  expect(cleanup).toBe(403)
})

test("แอดมินธรรมดาเลื่อนขั้นตัวเองเป็นผู้ดูแลระบบสูงสุดไม่ได้", async ({ page }) => {
  await loginAdmin(page, STAFF)

  const status = await page.evaluate(async () => {
    const me = await fetch("/api/auth/session").then((r) => r.json())
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: me.user.id, role: "superadmin" }),
    })
    return res.status
  })

  expect(status).toBe(403)
})
