import { describe, expect, it } from "vitest"

import { parseEnumParam, parsePagination } from "./query"

const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

describe("parseEnumParam", () => {
  it("คืนค่าเดิมเมื่อค่าตรงกับ enum", () => {
    expect(parseEnumParam(OrderStatus, "CONFIRMED")).toBe("CONFIRMED")
  })

  it("คืน undefined เมื่อไม่ได้ส่งค่ามา", () => {
    expect(parseEnumParam(OrderStatus, null)).toBeUndefined()
    expect(parseEnumParam(OrderStatus, "")).toBeUndefined()
    expect(parseEnumParam(OrderStatus, undefined)).toBeUndefined()
  })

  it('ถือว่า "all" คือไม่กรอง', () => {
    expect(parseEnumParam(OrderStatus, "all")).toBeUndefined()
  })

  it("ทิ้งค่าที่ไม่มีอยู่ใน enum แทนที่จะส่งต่อไปให้ Prisma", () => {
    expect(parseEnumParam(OrderStatus, "DROP TABLE")).toBeUndefined()
    expect(parseEnumParam(OrderStatus, "pending")).toBeUndefined() // ตรงตัวพิมพ์เท่านั้น
  })
})

describe("parsePagination", () => {
  const params = (query: string) => new URLSearchParams(query)

  it("ใช้ค่าเริ่มต้นเมื่อไม่ได้ส่งอะไรมา", () => {
    expect(parsePagination(params(""))).toEqual({ page: 1, limit: 10, skip: 0 })
  })

  it("คำนวณ skip จากหน้าและจำนวนต่อหน้า", () => {
    expect(parsePagination(params("page=3&limit=20"))).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
    })
  })

  it("กันหน้าติดลบและหน้าศูนย์", () => {
    expect(parsePagination(params("page=-5")).page).toBe(1)
    expect(parsePagination(params("page=0")).page).toBe(1)
  })

  it("จำกัดจำนวนต่อหน้าไม่ให้ดึงข้อมูลทั้งตารางในครั้งเดียว", () => {
    expect(parsePagination(params("limit=99999")).limit).toBe(100)
    expect(parsePagination(params("limit=0")).limit).toBe(10)
  })

  it("ไม่พังเมื่อค่าที่ส่งมาไม่ใช่ตัวเลข", () => {
    expect(parsePagination(params("page=abc&limit=xyz"))).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    })
  })
})
