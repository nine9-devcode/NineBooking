import { describe, expect, it } from "vitest"

import { shouldUseFullText } from "./search-products"

describe("shouldUseFullText", () => {
  it("คำที่ยาวพอใช้ full-text", () => {
    expect(shouldUseFullText("กล้อง")).toBe(true)
    expect(shouldUseFullText("nvr")).toBe(true)
    expect(shouldUseFullText("in-600")).toBe(true)
  })

  it("คำสั้นเกินไปตกไปใช้ ILIKE ตามเดิม", () => {
    expect(shouldUseFullText("ก")).toBe(false)
    expect(shouldUseFullText("")).toBe(false)
    expect(shouldUseFullText("   ")).toBe(false)
  })

  it("คำที่มีแต่อักขระพิเศษของ tsquery ไม่ถือว่าค้นได้", () => {
    // ถ้าปล่อยผ่าน to_tsquery จะได้สตริงว่างแล้ว Postgres โยน error
    expect(shouldUseFullText("&|!()")).toBe(false)
    expect(shouldUseFullText(":*:*")).toBe(false)
  })

  it("ผู้ใช้เขียนตัวดำเนินการของ tsquery เองไม่ได้", () => {
    // ตัวอักษรจริงยังเหลืออยู่ จึงค้นได้ แต่ & | ! ถูกตัดทิ้งไปแล้ว
    expect(shouldUseFullText("กล้อง & !nvr")).toBe(true)
  })
})
