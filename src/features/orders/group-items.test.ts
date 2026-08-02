import { describe, expect, it } from "vitest"

import {
  calculateGroupedSummary,
  groupItemsByProduct,
  hasGroupableItems,
  type BaseItem,
} from "./group-items"

const product = (id: string, name: string) => ({
  id,
  name,
  image: null,
  slug: id,
  isActive: true,
})

/**
 * ตะกร้าเก็บสินค้าหลัก 1 แถวและสินค้าคู่แยกอีกแถวหนึ่ง
 * ฟังก์ชันนี้ต้องรวมแถวที่เป็นสินค้าเดียวกันให้แสดงเป็นก้อนเดียว
 */
function item(
  id: string,
  productId: string,
  quantity: number,
  pairedId?: string
): BaseItem {
  return {
    id,
    quantity,
    product: product(productId, `สินค้า ${productId}`),
    pairedProduct: pairedId ? product(pairedId, `สินค้าคู่ ${pairedId}`) : null,
  } as BaseItem
}

describe("groupItemsByProduct", () => {
  it("รวมแถวที่เป็นสินค้าเดียวกันเข้าด้วยกัน", () => {
    const groups = groupItemsByProduct([
      item("1", "camera", 2),
      item("2", "camera", 1, "switch"),
      item("3", "nvr", 1),
    ])

    expect(groups).toHaveLength(2)

    const camera = groups.find((g) => g.productId === "camera")!
    expect(camera.mainQuantity).toBe(2)
    expect(camera.pairedItems).toHaveLength(1)
    expect(camera.totalQuantity).toBe(3)
  })

  it("แยกจำนวนสินค้าหลักกับสินค้าคู่ออกจากกัน", () => {
    const [group] = groupItemsByProduct([
      item("1", "camera", 3),
      item("2", "camera", 5, "switch"),
    ])

    expect(group.mainQuantity).toBe(3)
    expect(group.pairedItems[0].quantity).toBe(5)
  })

  it("คืนอาร์เรย์ว่างเมื่อไม่มีรายการ", () => {
    expect(groupItemsByProduct([])).toEqual([])
  })
})

describe("hasGroupableItems", () => {
  it("เป็นจริงเมื่อมีสินค้าซ้ำกัน", () => {
    expect(hasGroupableItems([item("1", "camera", 1), item("2", "camera", 1)])).toBe(true)
  })

  it("เป็นเท็จเมื่อสินค้าไม่ซ้ำกันเลย", () => {
    expect(hasGroupableItems([item("1", "camera", 1), item("2", "nvr", 1)])).toBe(false)
  })
})

describe("calculateGroupedSummary", () => {
  it("นับจำนวนสินค้าหลักและสินค้าคู่แยกกัน", () => {
    const groups = groupItemsByProduct([
      item("1", "camera", 2),
      item("2", "camera", 1, "switch"),
      item("3", "nvr", 4),
      item("4", "nvr", 2, "cable"),
    ])

    const summary = calculateGroupedSummary(groups)

    expect(summary.groupCount).toBe(2)
    expect(summary.totalMainQuantity).toBe(6)
    expect(summary.totalPairedItems).toBe(2)
    expect(summary.totalPairedQuantity).toBe(3)
  })
})
