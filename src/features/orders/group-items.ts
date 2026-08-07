/**
 * รวมรายการในคำสั่งจองที่เป็นสินค้าตัวเดียวกันเข้าด้วยกัน
 *
 * ระบบเก็บ "สินค้าหลัก" กับ "สินค้าที่ใช้คู่กัน" เป็น OrderItem คนละแถว
 * เวลาแสดงผลจึงต้องยุบกลับให้เห็นเป็นชุดเดียว
 *
 * ก่อนหน้านี้ตรรกะนี้ถูกเขียนซ้ำห้าที่ — สองที่อยู่ในไฟล์เดียวกันด้วยซ้ำ
 * (api/orders/route.ts) ที่เหลืออยู่ใน api/admin/orders และหน้ารายละเอียด
 * ผลคือจำนวนที่ลูกค้าเห็นในรายการ ที่แอดมินเห็น ที่อยู่ในอีเมล และในหน้า
 * รายละเอียด ถูกคำนวณด้วยโค้ดคนละชุด แก้ที่หนึ่งอีกสี่ที่ไม่ตาม
 */

export interface OrderItemSnapshot {
  id: string
  /**
   * เป็น null ได้เมื่อสินค้าต้นทางถูกลบไปแล้ว — แถวนี้ snapshot ชื่อกับรูปไว้แล้ว
   * ประวัติจึงยังอ่านออก (ดู onDelete: SetNull ใน schema)
   */
  productId: string | null
  productName: string
  productImage: string | null
  pairedProductId: string | null
  pairedProductName: string | null
  pairedProductImage: string | null
  quantity: number
}

export interface GroupedPairedItem<T> {
  itemId: string
  name: string
  image: string | null
  quantity: number
  /** แถวต้นทาง เผื่อผู้เรียกต้องใช้ฟิลด์อื่นที่ include มา */
  item: T
}

export interface GroupedOrderItem<T> {
  groupId: string
  productId: string | null
  productName: string
  productImage: string | null
  /** จำนวนของสินค้าหลัก (ไม่รวมสินค้าที่ใช้คู่กัน) */
  mainQuantity: number
  pairedItems: GroupedPairedItem<T>[]
  /** จำนวนรวมทั้งสินค้าหลักและสินค้าคู่ */
  totalQuantity: number
  mainItems: T[]
}

/**
 * จัดกลุ่มตามสินค้า
 *
 * สินค้าที่ถูกลบไปแล้ว (productId เป็น null) จัดกลุ่มด้วยชื่อที่ snapshot ไว้แทน
 * เพื่อไม่ให้ทุกตัวถูกยุบรวมกันเป็นก้อนเดียวเพราะคีย์เป็น null เหมือนกันหมด
 */
export function groupOrderItems<T extends OrderItemSnapshot>(
  items: T[]
): GroupedOrderItem<T>[] {
  const groups = new Map<string, GroupedOrderItem<T>>()

  for (const item of items) {
    const key = item.productId ?? `deleted:${item.productName}`

    let group = groups.get(key)
    if (!group) {
      group = {
        groupId: key,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        mainQuantity: 0,
        pairedItems: [],
        totalQuantity: 0,
        mainItems: [],
      }
      groups.set(key, group)
    }

    if (item.pairedProductName) {
      group.pairedItems.push({
        itemId: item.id,
        name: item.pairedProductName,
        image: item.pairedProductImage,
        quantity: item.quantity,
        item,
      })
    } else {
      group.mainQuantity += item.quantity
      group.mainItems.push(item)
    }

    group.totalQuantity += item.quantity
  }

  return [...groups.values()]
}

export interface OrderItemsSummary {
  /** จำนวนสินค้าหลักแบบไม่ซ้ำ */
  productCount: number
  mainQuantity: number
  pairedQuantity: number
  totalQuantity: number
}

export function summarizeOrderItems<T>(groups: GroupedOrderItem<T>[]): OrderItemsSummary {
  let mainQuantity = 0
  let pairedQuantity = 0

  for (const group of groups) {
    mainQuantity += group.mainQuantity
    pairedQuantity += group.pairedItems.reduce((sum, paired) => sum + paired.quantity, 0)
  }

  return {
    productCount: groups.length,
    mainQuantity,
    pairedQuantity,
    totalQuantity: mainQuantity + pairedQuantity,
  }
}

/** รูปแบบที่เทมเพลตอีเมลรับ — แบนกว่าเพราะ react-email ไม่ต้องใช้แถวต้นทาง */
export function toEmailItems<T extends OrderItemSnapshot>(groups: GroupedOrderItem<T>[]) {
  return groups.map((group) => ({
    productName: group.productName,
    productImage: group.productImage,
    mainQuantity: group.mainQuantity,
    pairedProducts: group.pairedItems.map((paired) => ({
      name: paired.name,
      image: paired.image,
      quantity: paired.quantity,
    })),
  }))
}

// ===================================================================
// อีกรูปแบบหนึ่ง: รายการที่ยัง join ตัวสินค้ามาด้วย (ตะกร้า / หน้ารายละเอียด)
//
// ต่างจากด้านบนตรงที่ยังมี relation `product` / `pairedProduct` ให้ใช้
// ไม่ใช่แค่ชื่อกับรูปที่ snapshot ไว้ จึงลิงก์ไปหน้าสินค้าได้
// ===================================================================

export interface ProductRef {
  id: string
  name: string
  image: string | null
  slug?: string | null
  isActive?: boolean
}

export interface BaseItem {
  id: string
  quantity: number
  product: ProductRef
  pairedProduct?: ProductRef | null
}

export interface PairedItem {
  itemId: string
  quantity: number
  pairedProduct: ProductRef
}

export interface GroupedItem {
  productId: string
  product: ProductRef
  mainQuantity: number
  pairedItems: PairedItem[]
  totalQuantity: number
}

export interface GroupedSummary {
  /** จำนวนสินค้าหลักแบบไม่ซ้ำ */
  groupCount: number
  totalMainQuantity: number
  totalPairedItems: number
  totalPairedQuantity: number
  totalQuantity: number
}

export function groupItemsByProduct<T extends BaseItem>(items: T[]): GroupedItem[] {
  const groups = new Map<string, GroupedItem>()

  for (const item of items) {
    const productId = item.product.id

    let group = groups.get(productId)
    if (!group) {
      group = {
        productId,
        product: item.product,
        mainQuantity: 0,
        pairedItems: [],
        totalQuantity: 0,
      }
      groups.set(productId, group)
    }

    if (item.pairedProduct) {
      group.pairedItems.push({
        itemId: item.id,
        quantity: item.quantity,
        pairedProduct: item.pairedProduct,
      })
    } else {
      group.mainQuantity += item.quantity
    }

    group.totalQuantity += item.quantity
  }

  return [...groups.values()]
}

/** มีสินค้าตัวเดียวกันซ้ำหลายแถวไหม */
export function hasGroupableItems<T extends BaseItem>(items: T[]): boolean {
  const ids = items.map((item) => item.product.id)
  return new Set(ids).size < ids.length
}

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
    groupCount: groups.length,
    totalMainQuantity,
    totalPairedItems,
    totalPairedQuantity,
    totalQuantity: totalMainQuantity + totalPairedQuantity,
  }
}
