import { expect, test } from "@playwright/test"

import { ADMIN, fillCredentials } from "./helpers"

/**
 * เทสต์ชุดนี้พิสูจน์ว่า audit log บันทึกจริงและค้นได้จริง
 *
 * ก่อนหน้านี้ประกาศ action ไว้ 18 ตัวแต่ต่อสายจริงแค่ 2 จุด หน้า /admin/audit-log
 * จึงดูโล่งและชวนเข้าใจผิดว่าไม่มีใครทำอะไรในระบบ
 */

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login")
  await fillCredentials(page, ADMIN.email, ADMIN.password)
  await page.getByRole("button", { name: /เข้าสู่ระบบ/ }).click()

  // ต้องเป็น /admin$ ไม่ใช่ /admin เฉยๆ เพราะ /admin/login ก็เข้าเงื่อนไขนั้น
  // แล้วเทสต์จะผ่านตั้งแต่ยังไม่ได้ล็อกอิน ไปตายตอนเรียก API แทน
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
}

test("แอดมินเปลี่ยนการตั้งค่าแล้วมีบันทึกในประวัติการใช้งาน", async ({ page }) => {
  await loginAsAdmin(page)

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

test("ค้นประวัติด้วยชื่อที่คนอ่านออกได้", async ({ page }) => {
  // คำถามที่คนถามจริงคือ "ใครแตะ ORD-... บ้าง" ซึ่งเดิมทำไม่ได้เลย
  // เพราะบันทึกเก็บแค่ entityId ที่เป็น cuid ภายใน
  await loginAsAdmin(page)
  await page.goto("/admin/audit-log")

  const firstRow = page.locator("tbody tr").first()
  await expect(firstRow).toBeVisible({ timeout: 15_000 })

  // ช่อง "ข้อมูล" บรรทัดล่างคือ entityLabel ที่บันทึกไว้
  const cellText = await firstRow.locator("td").nth(3).innerText()
  const keyword = cellText.split(/\r?\n/).pop()?.trim() ?? ""
  expect(keyword.length).toBeGreaterThan(3)

  await page.getByLabel("ค้นหา").fill(keyword)

  await expect(page.locator("tbody tr").first()).toContainText(keyword, {
    timeout: 15_000,
  })
})
