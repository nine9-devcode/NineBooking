import { describe, expect, it } from "vitest"

import {
  InvalidTransitionError,
  assertTransition,
  canTransition,
  isTerminal,
  nextStatuses,
} from "./order-status"

describe("การเปลี่ยนสถานะคำสั่งจอง", () => {
  it("เดินไปข้างหน้าตามลำดับได้", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true)
    expect(canTransition("CONFIRMED", "COMPLETED")).toBe(true)
  })

  it("ยกเลิกได้ตราบใดที่ยังไม่จบ", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true)
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true)
  })

  it("ข้ามขั้นไม่ได้", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(false)
  })

  it("ย้อนกลับไม่ได้", () => {
    expect(canTransition("CONFIRMED", "PENDING")).toBe(false)
    expect(canTransition("COMPLETED", "CONFIRMED")).toBe(false)
  })

  it("สถานะปลายทางออกไปไหนไม่ได้อีก", () => {
    // นี่คือบั๊กเดิม: CANCELLED → COMPLETED เคยผ่านได้
    expect(canTransition("CANCELLED", "COMPLETED")).toBe(false)
    expect(canTransition("COMPLETED", "PENDING")).toBe(false)
    expect(canTransition("CANCELLED", "PENDING")).toBe(false)

    expect(isTerminal("COMPLETED")).toBe(true)
    expect(isTerminal("CANCELLED")).toBe(true)
    expect(isTerminal("PENDING")).toBe(false)
  })

  it("เขียนค่าเดิมทับถือว่าไม่มีอะไรเปลี่ยน", () => {
    expect(canTransition("PENDING", "PENDING")).toBe(true)
    expect(canTransition("CANCELLED", "CANCELLED")).toBe(true)
  })

  it("nextStatuses ตรงกับกฎ เพื่อให้ปุ่มใน UI ไม่หลุดจากฝั่งเซิร์ฟเวอร์", () => {
    expect(nextStatuses("PENDING")).toEqual(["CONFIRMED", "CANCELLED"])
    expect(nextStatuses("CONFIRMED")).toEqual(["COMPLETED", "CANCELLED"])
    expect(nextStatuses("COMPLETED")).toEqual([])
    expect(nextStatuses("CANCELLED")).toEqual([])
  })

  it("assertTransition โยน error ที่อ่านรู้เรื่องเมื่อไปไม่ได้", () => {
    expect(() => assertTransition("PENDING", "CONFIRMED")).not.toThrow()

    expect(() => assertTransition("CANCELLED", "COMPLETED")).toThrow(InvalidTransitionError)
    expect(() => assertTransition("CANCELLED", "COMPLETED")).toThrow(/ยกเลิกแล้ว/)
  })
})
