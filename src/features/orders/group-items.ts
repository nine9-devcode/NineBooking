// Helper สำหรับ group สินค้าที่มี productId เดียวกัน
// ใช้ได้ทั้ง CartItem และ OrderItem

export interface GroupedSummary {
  groupCount: number
  totalMainQuantity: number
  totalPairedItems: number
  totalPairedQuantity: number
  totalQuantity: number
}

export interface BaseItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    image: string | null
    slug?: string | null
    isActive?: boolean
  }
  pairedProduct?: {
    id: string
    name: string
    image: string | null
    slug?: string | null
    isActive?: boolean
  } | null
}

export interface PairedItem {
  itemId: string
  quantity: number
  pairedProduct: {
    id: string
    name: string
    image: string | null
    slug?: string | null
    isActive?: boolean
  }
}

export interface GroupedItem {
  productId: string
  product: {
    id: string
    name: string
    image: string | null
    slug?: string | null
    isActive?: boolean
  }
  // จำนวนสินค้าหลัก
  mainQuantity: number
  // รายการสินค้าคู่
  pairedItems: PairedItem[]
  // จำนวนรวม
  totalQuantity: number
  // Legacy: เก็บไว้สำหรับ backward compatibility
  pairs: {
    itemId: string
    quantity: number
    pairedProduct: {
      id: string
      name: string
      image: string | null
      slug?: string | null
      isActive?: boolean
    } | null
  }[]
}

/**
 * Group items ที่มี productId เดียวกันเข้าด้วยกัน
 * แยก mainQuantity (สินค้าหลัก) และ pairedItems (สินค้าคู่) ชัดเจน
 * @param items รายการสินค้า (CartItem หรือ OrderItem)
 * @returns รายการที่ group แล้ว
 */
export function groupItemsByProduct<T extends BaseItem>(items: T[]): GroupedItem[] {
  const grouped = new Map<string, GroupedItem>()

  for (const item of items) {
    const productId = item.product.id

    if (!grouped.has(productId)) {
      grouped.set(productId, {
        productId,
        product: item.product,
        mainQuantity: 0,
        pairedItems: [],
        totalQuantity: 0,
        pairs: [], // Legacy
      })
    }

    const group = grouped.get(productId)!

    if (item.pairedProduct) {
      // สินค้าคู่
      group.pairedItems.push({
        itemId: item.id,
        quantity: item.quantity,
        pairedProduct: item.pairedProduct,
      })
    } else {
      // สินค้าหลัก
      group.mainQuantity += item.quantity
    }

    // Legacy: เก็บทุก pair ไว้
    group.pairs.push({
      itemId: item.id,
      quantity: item.quantity,
      pairedProduct: item.pairedProduct || null,
    })

    // อัพเดท totalQuantity
    group.totalQuantity += item.quantity
  }

  return Array.from(grouped.values())
}

/**
 * ตรวจสอบว่ามีสินค้าที่ group ได้หรือไม่
 * (มี productId ซ้ำกัน)
 */
export function hasGroupableItems<T extends BaseItem>(items: T[]): boolean {
  const productIds = items.map((item) => item.product.id)
  return new Set(productIds).size < productIds.length
}

/**
 * คำนวณสรุปจาก grouped items
 */
export function calculateGroupedSummary(groups: GroupedItem[]): GroupedSummary {
  let totalMainQuantity = 0
  let totalPairedQuantity = 0
  let totalPairedItems = 0

  for (const group of groups) {
    totalMainQuantity += group.mainQuantity
    totalPairedItems += group.pairedItems.length
    totalPairedQuantity += group.pairedItems.reduce((sum, p) => sum + p.quantity, 0)
  }

  return {
    groupCount: groups.length, // จำนวนสินค้าหลัก (unique)
    totalMainQuantity, // จำนวนชิ้นสินค้าหลัก
    totalPairedItems, // จำนวนรายการสินค้าคู่
    totalPairedQuantity, // จำนวนชิ้นสินค้าคู่
    totalQuantity: totalMainQuantity + totalPairedQuantity, // จำนวนชิ้นทั้งหมด
  }
}

