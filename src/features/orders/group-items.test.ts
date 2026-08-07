import { describe, expect, it } from "vitest"

import {
  calculateGroupedSummary,
  groupItemsByProduct,
  groupOrderItems,
  summarizeOrderItems,
  toEmailItems,
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
function item(id: string, productId: string, quantity: number, pairedId?: string): BaseItem {
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

// ── groupOrderItems: ตัวที่ฝั่งเซิร์ฟเวอร์ใช้ (ทำงานกับ snapshot ไม่ใช่ relation) ──

function orderItem(
  id: string,
  productId: string | null,
  productName: string,
  quantity: number,
  paired?: { id: string; name: string }
) {
  return {
    id,
    productId,
    productName,
    productImage: null,
    pairedProductId: paired?.id ?? null,
    pairedProductName: paired?.name ?? null,
    pairedProductImage: null,
    quantity,
  }
}

describe("groupOrderItems", () => {
  it("รวมสินค้าตัวเดียวกันเข้ากลุ่มเดียว", () => {
    const groups = groupOrderItems([
      orderItem("1", "p1", "กล้อง", 2),
      orderItem("2", "p1", "กล้อง", 3),
      orderItem("3", "p2", "เครื่องบันทึก", 1),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0].mainQuantity).toBe(5)
    expect(groups[1].mainQuantity).toBe(1)
  })

  it("แยกสินค้าคู่ออกจากจำนวนสินค้าหลัก", () => {
    const [group] = groupOrderItems([
      orderItem("1", "p1", "กล้อง", 2),
      orderItem("2", "p1", "กล้อง", 4, { id: "p9", name: "อะแดปเตอร์" }),
    ])

    expect(group.mainQuantity).toBe(2)
    expect(group.pairedItems).toHaveLength(1)
    expect(group.pairedItems[0].name).toBe("อะแดปเตอร์")
    expect(group.totalQuantity).toBe(6)
  })

  it("สินค้าที่ถูกลบไปแล้วไม่ถูกยุบรวมกันเป็นก้อนเดียว", () => {
    // productId เป็น null ทั้งคู่ ถ้าใช้ productId เป็นคีย์ตรงๆ จะกลายเป็นกลุ่มเดียว
    const groups = groupOrderItems([
      orderItem("1", null, "สินค้า ก", 1),
      orderItem("2", null, "สินค้า ข", 1),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.productName)).toEqual(["สินค้า ก", "สินค้า ข"])
  })

  it("สรุปยอดแยกสินค้าหลักกับสินค้าคู่", () => {
    const summary = summarizeOrderItems(
      groupOrderItems([
        orderItem("1", "p1", "กล้อง", 2),
        orderItem("2", "p1", "กล้อง", 3, { id: "p9", name: "ขาตั้ง" }),
        orderItem("3", "p2", "สาย", 5),
      ])
    )

    expect(summary).toEqual({
      productCount: 2,
      mainQuantity: 7,
      pairedQuantity: 3,
      totalQuantity: 10,
    })
  })

  it("แปลงเป็นรูปแบบสำหรับอีเมลได้", () => {
    const items = toEmailItems(
      groupOrderItems([orderItem("1", "p1", "กล้อง", 2, { id: "p9", name: "ขาตั้ง" })])
    )

    expect(items).toEqual([
      {
        productName: "กล้อง",
        productImage: null,
        mainQuantity: 0,
        pairedProducts: [{ name: "ขาตั้ง", image: null, quantity: 2 }],
      },
    ])
  })
})
