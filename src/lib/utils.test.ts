import { describe, expect, it } from "vitest"

import { cn, formatCurrency, getErrorMessage } from "./utils"

describe("cn", () => {
  it("รวมคลาสเข้าด้วยกัน", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1")
  })

  it("ให้คลาสท้ายสุดชนะเมื่อชนกัน", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("ข้ามค่าที่เป็นเท็จ", () => {
    expect(cn("px-2", false, undefined, null, "py-1")).toBe("px-2 py-1")
  })
})

describe("getErrorMessage", () => {
  it("ดึงข้อความจาก Error", () => {
    expect(getErrorMessage(new Error("อีเมลซ้ำ"))).toBe("อีเมลซ้ำ")
  })

  it("รับ string ที่ถูก throw ตรงๆ ได้", () => {
    expect(getErrorMessage("พัง")).toBe("พัง")
  })

  it("ใช้ข้อความสำรองเมื่อสิ่งที่ throw มาไม่มีข้อความ", () => {
    expect(getErrorMessage(null, "ลองใหม่")).toBe("ลองใหม่")
    expect(getErrorMessage({ code: 500 }, "ลองใหม่")).toBe("ลองใหม่")
    expect(getErrorMessage(new Error(""), "ลองใหม่")).toBe("ลองใหม่")
  })
})

describe("formatCurrency", () => {
  it("จัดรูปแบบเป็นสกุลเงินบาท", () => {
    // ใช้ regex เพราะสัญลักษณ์เงินบาทกับช่องว่างต่างกันไปตาม ICU ของแต่ละ runtime
    expect(formatCurrency(1500)).toMatch(/1,500\.00/)
    expect(formatCurrency(0)).toMatch(/0\.00/)
  })
})
