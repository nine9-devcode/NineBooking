/**
 * ข้อมูลตัวอย่างสำหรับ NineBooking
 *
 *   npm run db:seed
 *
 * สคริปต์นี้ล้างข้อมูลเดิมทั้งหมดแล้วสร้างใหม่ จึงรันซ้ำได้เสมอ
 * รูปสินค้าเป็นไฟล์ SVG ที่สร้างขึ้นตอน seed ลงใน public/uploads/seed/
 */

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { PrismaClient, type Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const SEED_IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "seed")

// ── ผู้ใช้ตัวอย่าง ──────────────────────────────────────────────────
const ADMIN = {
  email: "admin@ninebooking.dev",
  password: "Admin@1234",
  name: "ผู้ดูแลระบบ",
  nickname: "แอดมิน",
}

const DEMO_USER = {
  email: "demo@ninebooking.dev",
  password: "Demo@1234",
  name: "สมชาย ใจดี",
  nickname: "ชาย",
}

// ── หมวดหมู่ + สินค้า ────────────────────────────────────────────────
type SeedProduct = {
  name: string
  subtitle: string
  slug: string
  description: string
  hue: number
}

type SeedCategory = {
  name: string
  slug: string
  description: string
  children?: SeedCategory[]
  products?: SeedProduct[]
}

const CATALOG: SeedCategory[] = [
  {
    name: "กล้องวงจรปิด",
    slug: "cctv",
    description: "กล้องสำหรับบ้านและอาคารสำนักงาน",
    children: [
      {
        name: "กล้องภายใน",
        slug: "cctv-indoor",
        description: "ติดตั้งภายในอาคาร",
        products: [
          {
            name: "กล้องภายใน รุ่น IN-200",
            subtitle: "ความละเอียด 2MP มองเห็นกลางคืน",
            slug: "camera-in-200",
            description:
              "<p>กล้องวงจรปิดสำหรับติดตั้งภายในอาคาร ความละเอียด 2 ล้านพิกเซล รองรับอินฟราเรดระยะ 10 เมตร</p><ul><li>บันทึกเสียงในตัว</li><li>ตรวจจับความเคลื่อนไหว</li><li>ดูผ่านมือถือได้</li></ul>",
            hue: 210,
          },
          {
            name: "กล้องภายใน รุ่น IN-400",
            subtitle: "ความละเอียด 4MP หมุนได้ 360 องศา",
            slug: "camera-in-400",
            description:
              "<p>กล้องหมุนได้รอบทิศทาง ควบคุมผ่านแอปพลิเคชัน เหมาะกับห้องขนาดใหญ่</p><ul><li>หมุนซ้ายขวา 355 องศา</li><li>ติดตามวัตถุอัตโนมัติ</li></ul>",
            hue: 218,
          },
          {
            name: "กล้องภายใน รุ่น IN-600 Pro",
            subtitle: "ความละเอียด 6MP พร้อม AI แยกแยะคน",
            slug: "camera-in-600-pro",
            description:
              "<p>รุ่นสูงสุดของซีรีส์ภายใน มีระบบ AI แยกแยะคนกับสัตว์เลี้ยง ลดการแจ้งเตือนผิดพลาด</p>",
            hue: 226,
          },
        ],
      },
      {
        name: "กล้องภายนอก",
        slug: "cctv-outdoor",
        description: "กันน้ำกันฝุ่น ติดตั้งภายนอกอาคาร",
        products: [
          {
            name: "กล้องภายนอก รุ่น OUT-200",
            subtitle: "มาตรฐานกันน้ำ IP66",
            slug: "camera-out-200",
            description:
              "<p>กล้องสำหรับติดตั้งภายนอก ทนแดดทนฝน มาตรฐาน IP66 อินฟราเรดระยะ 30 เมตร</p>",
            hue: 196,
          },
          {
            name: "กล้องภายนอก รุ่น OUT-500",
            subtitle: "ซูมออปติคัล 5 เท่า",
            slug: "camera-out-500",
            description:
              "<p>กล้องซูมออปติคัล เหมาะกับพื้นที่กว้าง เช่น ลานจอดรถหรือโกดังสินค้า</p>",
            hue: 188,
          },
        ],
      },
    ],
  },
  {
    name: "อุปกรณ์บันทึกภาพ",
    slug: "recorder",
    description: "เครื่องบันทึกและอุปกรณ์จัดเก็บข้อมูล",
    products: [
      {
        name: "เครื่องบันทึก NVR-8",
        subtitle: "รองรับกล้อง 8 ตัว",
        slug: "nvr-8",
        description:
          "<p>เครื่องบันทึกภาพผ่านเครือข่าย รองรับกล้องสูงสุด 8 ตัว ใส่ฮาร์ดดิสก์ได้ 1 ลูก</p>",
        hue: 258,
      },
      {
        name: "เครื่องบันทึก NVR-16",
        subtitle: "รองรับกล้อง 16 ตัว",
        slug: "nvr-16",
        description:
          "<p>เครื่องบันทึกภาพสำหรับงานขนาดกลาง รองรับกล้อง 16 ตัว ใส่ฮาร์ดดิสก์ได้ 2 ลูก</p>",
        hue: 266,
      },
      {
        name: "ฮาร์ดดิสก์สำหรับกล้อง 4TB",
        subtitle: "ออกแบบมาสำหรับเขียนต่อเนื่อง 24 ชั่วโมง",
        slug: "hdd-surveillance-4tb",
        description:
          "<p>ฮาร์ดดิสก์รุ่นสำหรับงานกล้องวงจรปิดโดยเฉพาะ ทนต่อการเขียนข้อมูลตลอดเวลา</p>",
        hue: 274,
      },
    ],
  },
  {
    name: "ระบบควบคุมประตู",
    slug: "access-control",
    description: "อุปกรณ์ควบคุมการเข้าออกอาคาร",
    products: [
      {
        name: "เครื่องสแกนลายนิ้วมือ FP-100",
        subtitle: "จุคนได้ 1,000 คน",
        slug: "fingerprint-fp-100",
        description:
          "<p>เครื่องสแกนลายนิ้วมือพร้อมระบบบันทึกเวลาเข้าออก เชื่อมต่อคอมพิวเตอร์ผ่าน USB หรือ LAN</p>",
        hue: 160,
      },
      {
        name: "กลอนแม่เหล็กไฟฟ้า 600 ปอนด์",
        subtitle: "แรงยึด 280 กิโลกรัม",
        slug: "magnetic-lock-600",
        description:
          "<p>กลอนแม่เหล็กไฟฟ้าสำหรับประตูบานสวิงและบานเลื่อน ใช้ร่วมกับเครื่องสแกนได้ทุกรุ่น</p>",
        hue: 152,
      },
      {
        name: "ปุ่มกดออก EB-01",
        subtitle: "สเตนเลสไม่ต้องสัมผัส",
        slug: "exit-button-eb-01",
        description: "<p>ปุ่มกดเปิดประตูจากด้านใน แบบไม่ต้องสัมผัส ลดการแพร่กระจายเชื้อโรค</p>",
        hue: 144,
      },
    ],
  },
  {
    name: "อุปกรณ์เครือข่าย",
    slug: "network",
    description: "สวิตช์และอุปกรณ์เชื่อมต่อ",
    products: [
      {
        name: "PoE Switch 8 พอร์ต",
        subtitle: "จ่ายไฟผ่านสายแลนได้ทุกพอร์ต",
        slug: "poe-switch-8",
        description:
          "<p>สวิตช์จ่ายไฟผ่านสายแลน 8 พอร์ต กำลังไฟรวม 120 วัตต์ ติดตั้งกล้องได้โดยไม่ต้องเดินไฟแยก</p>",
        hue: 30,
      },
      {
        name: "PoE Switch 16 พอร์ต",
        subtitle: "กำลังไฟรวม 250 วัตต์",
        slug: "poe-switch-16",
        description:
          "<p>สวิตช์จ่ายไฟผ่านสายแลนสำหรับงานขนาดกลาง มีพอร์ตอัปลิงก์ความเร็วสูง 2 พอร์ต</p>",
        hue: 22,
      },
      {
        name: "สาย LAN CAT6 ม้วน 305 เมตร",
        subtitle: "ทองแดงแท้ รองรับ PoE",
        slug: "cat6-cable-305m",
        description:
          "<p>สายแลน CAT6 ทองแดงแท้ 100% รองรับการจ่ายไฟผ่านสาย เหมาะกับงานติดตั้งกล้อง</p>",
        hue: 14,
      },
      {
        name: "อะแดปเตอร์ 12V 2A",
        subtitle: "สำหรับกล้องที่ไม่รองรับ PoE",
        slug: "adapter-12v-2a",
        description: "<p>อะแดปเตอร์จ่ายไฟสำหรับกล้องวงจรปิดทั่วไป มีระบบตัดไฟเมื่อไฟเกิน</p>",
        hue: 6,
      },
    ],
  },
]

// ── รูปตัวอย่าง ─────────────────────────────────────────────────────
/**
 * สร้างรูป placeholder เป็น SVG แทนการเก็บไฟล์ภาพจริงไว้ใน repo
 * ทำให้ repo เบาและไม่มีปัญหาลิขสิทธิ์รูป
 */
function placeholderSvg(label: string, hue: number): string {
  const escaped = label.replace(/&/g, "&amp;").replace(/</g, "&lt;")

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 55% 26%)"/>
      <stop offset="100%" stop-color="hsl(${hue + 18} 60% 14%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="400" cy="330" r="120" fill="none" stroke="hsl(${hue} 70% 72%)" stroke-width="14" opacity="0.7"/>
  <circle cx="400" cy="330" r="46" fill="hsl(${hue} 70% 72%)" opacity="0.85"/>
  <text x="400" y="560" text-anchor="middle"
        font-family="'Segoe UI', system-ui, sans-serif" font-size="34" font-weight="600"
        fill="hsl(${hue} 40% 92%)">${escaped}</text>
  <text x="400" y="606" text-anchor="middle"
        font-family="'Segoe UI', system-ui, sans-serif" font-size="22"
        fill="hsl(${hue} 30% 78%)">NineBooking demo</text>
</svg>`
}

async function writePlaceholder(slug: string, label: string, hue: number): Promise<string> {
  const fileName = `${slug}.svg`
  await writeFile(path.join(SEED_IMAGE_DIR, fileName), placeholderSvg(label, hue), "utf8")
  return `/uploads/seed/${fileName}`
}

// ── ตัวช่วย ─────────────────────────────────────────────────────────
const THAI_ADDRESS = {
  address: "99/9 หมู่บ้านตัวอย่าง ซอยสาธิต 5",
  province: "กรุงเทพมหานคร",
  district: "เขตห้วยขวาง",
  subDistrict: "แขวงสามเสนนอก",
  postalCode: "10310",
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

/** ลบทุกตารางตามลำดับที่ไม่ติด foreign key */
async function reset() {
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.userOrderNotification.deleteMany()
  await prisma.orderNotification.deleteMany()
  await prisma.order.deleteMany()
  await prisma.userSupportNotification.deleteMany()
  await prisma.issueNotification.deleteMany()
  await prisma.contactIssue.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.productViewSummary.deleteMany()
  await prisma.productView.deleteMany()
  await prisma.exclusivePairing.deleteMany()
  await prisma.product.deleteMany()
  await prisma.categoryPairing.deleteMany()
  await prisma.category.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.rateLimit.deleteMany()
  await prisma.documentCounter.deleteMany()
  await prisma.user.deleteMany()
  await prisma.quotationSeller.deleteMany()
  await prisma.quotationSettings.deleteMany()
  await prisma.seoSettings.deleteMany()
  await prisma.systemSettings.deleteMany()
}

/**
 * ตั้งตัวนับเลขที่เอกสารให้ตรงกับข้อมูลตัวอย่างที่เพิ่งใส่ไป
 *
 * ถ้าไม่ทำ ใบเสนอราคาใบแรกที่ออกหลัง seed จะได้เลข QT-<ปี>-0001
 * ซึ่งชนกับใบตัวอย่างที่มีอยู่แล้ว แล้วพังทันทีที่คนลองกดใช้งานจริง
 */
async function syncDocumentCounters() {
  const [orders, issues, quotations] = await Promise.all([
    prisma.order.findMany({ select: { orderNumber: true } }),
    prisma.contactIssue.findMany({ select: { issueNumber: true } }),
    prisma.quotation.findMany({ select: { baseNumber: true } }),
  ])

  // เก็บค่าสูงสุดของแต่ละช่วง (ORDER นับรายวัน ส่วน ISSUE/QUOTATION นับรายปี)
  const maxByKey = new Map<string, { scope: string; period: string; value: number }>()

  const track = (scope: string, period: string, value: number) => {
    if (!Number.isFinite(value)) return
    const key = `${scope}:${period}`
    const current = maxByKey.get(key)
    if (!current || value > current.value) maxByKey.set(key, { scope, period, value })
  }

  for (const { orderNumber } of orders) {
    const [, period, sequence] = orderNumber.split("-")
    track("ORDER", period, Number.parseInt(sequence, 10))
  }
  for (const { issueNumber } of issues) {
    const [, period, sequence] = issueNumber.split("-")
    track("ISSUE", period, Number.parseInt(sequence, 10))
  }
  for (const { baseNumber } of quotations) {
    const [, period, sequence] = baseNumber.split("-")
    track("QUOTATION", period, Number.parseInt(sequence, 10))
  }

  await prisma.documentCounter.createMany({ data: [...maxByKey.values()] })
}

/** ตัวอย่างประวัติการใช้งาน เพื่อให้หน้า /admin/audit-log ไม่ว่างเปล่าตอนเปิดดูครั้งแรก */
async function seedAuditLog(
  adminId: string,
  orders: { id: string; orderNumber: string; status: string }[]
) {
  const entries: Prisma.AuditLogCreateManyInput[] = []

  for (const order of orders) {
    if (order.status === "PENDING") continue

    entries.push({
      actorId: adminId,
      action: "order.status_changed",
      entityType: "Order",
      entityId: order.id,
      before: { status: "PENDING" },
      after: { status: order.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED" },
      createdAt: daysAgo(3),
    })
  }

  if (entries.length > 0) {
    await prisma.auditLog.createMany({ data: entries })
  }
}

async function main() {
  console.log("กำลังใส่ข้อมูลตัวอย่าง...")

  await mkdir(SEED_IMAGE_DIR, { recursive: true })
  await reset()

  // ── ผู้ใช้ ──
  const [admin, demoUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: ADMIN.email,
        password: await bcrypt.hash(ADMIN.password, 10),
        name: ADMIN.name,
        nickname: ADMIN.nickname,
        phone: "0800000001",
        role: "admin",
        residenceType: "condo",
        isProfileCompleted: true,
        ...THAI_ADDRESS,
      },
    }),
    prisma.user.create({
      data: {
        email: DEMO_USER.email,
        password: await bcrypt.hash(DEMO_USER.password, 10),
        name: DEMO_USER.name,
        nickname: DEMO_USER.nickname,
        phone: "0800000002",
        role: "user",
        memberType: "contractor",
        residenceType: "single_house",
        isProfileCompleted: true,
        ...THAI_ADDRESS,
      },
    }),
  ])

  // อีก 8 คนไว้ให้หน้าจัดการสมาชิกมีข้อมูลพอสำหรับทดสอบแบ่งหน้า
  const extraUserPassword = await bcrypt.hash("Demo@1234", 10)
  await prisma.user.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      email: `user${i + 1}@ninebooking.dev`,
      password: extraUserPassword,
      name: `ผู้ใช้ทดสอบ ${i + 1}`,
      nickname: `ทดสอบ${i + 1}`,
      phone: `08100000${String(i + 10).padStart(2, "0")}`,
      role: "user",
      memberType: ["customer", "contractor", "dealer", "other"][i % 4],
      residenceType: ["condo", "single_house", "townhouse", "apartment"][i % 4],
      isProfileCompleted: true,
      ...THAI_ADDRESS,
      createdAt: daysAgo(60 - i * 5),
    })),
  })

  // ── หมวดหมู่ + สินค้า ──
  const productBySlug = new Map<string, { id: string; name: string; image: string }>()
  const categoryIdBySlug = new Map<string, string>()

  let categoryOrder = 1

  async function createCategory(node: SeedCategory, parentId: string | null) {
    const category = await prisma.category.create({
      data: {
        name: node.name,
        slug: node.slug,
        description: node.description,
        sortOrder: categoryOrder++,
        parentId,
      },
    })
    categoryIdBySlug.set(node.slug, category.id)

    for (const p of node.products ?? []) {
      const image = await writePlaceholder(p.slug, p.name, p.hue)
      const gallery = await Promise.all([
        writePlaceholder(`${p.slug}-2`, `${p.name} — มุมที่ 2`, p.hue + 6),
        writePlaceholder(`${p.slug}-3`, `${p.name} — มุมที่ 3`, p.hue + 12),
      ])

      const product = await prisma.product.create({
        data: {
          name: p.name,
          subtitle: p.subtitle,
          slug: p.slug,
          description: p.description,
          image,
          images: gallery,
          categoryId: category.id,
          datasheets: [
            {
              type: "url",
              name: "คู่มือการใช้งาน (ตัวอย่าง)",
              value: "https://example.com/manual.pdf",
            },
          ] as Prisma.InputJsonValue,
        },
      })

      productBySlug.set(p.slug, { id: product.id, name: product.name, image })
    }

    for (const child of node.children ?? []) {
      await createCategory(child, category.id)
    }
  }

  for (const node of CATALOG) {
    await createCategory(node, null)
  }

  // ── จับคู่หมวดหมู่: เลือกกล้องแล้วระบบเสนออุปกรณ์ที่ใช้ร่วมกัน ──
  const pairs: [string, string][] = [
    ["cctv-indoor", "network"],
    ["cctv-outdoor", "network"],
    ["cctv-outdoor", "recorder"],
    ["access-control", "network"],
  ]

  for (const [a, b] of pairs) {
    const categoryAId = categoryIdBySlug.get(a)
    const categoryBId = categoryIdBySlug.get(b)
    if (categoryAId && categoryBId) {
      await prisma.categoryPairing.create({ data: { categoryAId, categoryBId } })
    }
  }

  // ── จับคู่สินค้าเฉพาะ: NVR-16 ใช้กับ PoE 16 พอร์ตเท่านั้น ──
  const nvr16 = productBySlug.get("nvr-16")
  const poe16 = productBySlug.get("poe-switch-16")
  if (nvr16 && poe16) {
    await prisma.exclusivePairing.create({
      data: { productAId: nvr16.id, productBId: poe16.id },
    })
  }

  // ── ยอดเข้าชมย้อนหลัง 90 วัน เพื่อให้กราฟในหน้า dashboard มีข้อมูล ──
  const allProducts = [...productBySlug.values()]
  const summaries: Prisma.ProductViewSummaryCreateManyInput[] = []

  for (let day = 90; day >= 1; day--) {
    const date = daysAgo(day)
    date.setUTCHours(0, 0, 0, 0)

    for (const product of allProducts) {
      // สินค้ายอดนิยมบางตัวมีคนดูมากกว่า จะได้เห็นความต่างในกราฟ
      const base = product.name.includes("IN-200") || product.name.includes("PoE") ? 12 : 4
      const viewCount = Math.max(
        0,
        Math.round(base + Math.sin(day / 7) * 4 + Math.random() * 6)
      )
      if (viewCount > 0) {
        summaries.push({ productId: product.id, date, viewCount })
      }
    }
  }
  await prisma.productViewSummary.createMany({ data: summaries })

  await prisma.product.updateMany({ data: { viewCount: 0 } })
  for (const product of allProducts) {
    const total = summaries
      .filter((s) => s.productId === product.id)
      .reduce((sum, s) => sum + (s.viewCount ?? 0), 0)
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: total },
    })
  }

  // ── ใบจองตัวอย่าง คละสถานะ ──
  const orderPlans = [
    { status: "PENDING" as const, days: 1, items: ["camera-in-200", "poe-switch-8"] },
    {
      status: "CONFIRMED" as const,
      days: 5,
      items: ["camera-out-200", "nvr-8", "cat6-cable-305m"],
    },
    {
      status: "COMPLETED" as const,
      days: 12,
      items: ["fingerprint-fp-100", "magnetic-lock-600"],
    },
    {
      status: "COMPLETED" as const,
      days: 25,
      items: ["camera-in-600-pro", "nvr-16", "poe-switch-16"],
    },
    { status: "CANCELLED" as const, days: 33, items: ["adapter-12v-2a"] },
  ]

  const createdOrders: { id: string; orderNumber: string; status: string }[] = []

  for (const [index, plan] of orderPlans.entries()) {
    const createdAt = daysAgo(plan.days)
    const dateStr = createdAt.toISOString().slice(0, 10).replace(/-/g, "")
    const orderNumber = `ORD-${dateStr}-${String(index + 1).padStart(3, "0")}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: demoUser.id,
        customerName: DEMO_USER.name,
        customerNickname: DEMO_USER.nickname,
        customerEmail: DEMO_USER.email,
        customerPhone: "0800000002",
        shippingAddress: THAI_ADDRESS.address,
        shippingProvince: THAI_ADDRESS.province,
        shippingDistrict: THAI_ADDRESS.district,
        shippingSubDistrict: THAI_ADDRESS.subDistrict,
        shippingPostalCode: THAI_ADDRESS.postalCode,
        shippingResidenceType: "single_house",
        customerNote: index === 0 ? "รบกวนติดต่อกลับช่วงบ่ายครับ" : null,
        status: plan.status,
        cancelledBy: plan.status === "CANCELLED" ? "CUSTOMER" : null,
        createdAt,
        updatedAt: createdAt,
        orderItems: {
          create: plan.items.flatMap((slug) => {
            const product = productBySlug.get(slug)
            if (!product) return []
            return [
              {
                productId: product.id,
                quantity: 1 + (index % 3),
                productName: product.name,
                productImage: product.image,
                createdAt,
              },
            ]
          }),
        },
      },
    })

    createdOrders.push({ id: order.id, orderNumber, status: plan.status })

    // กระดิ่งแจ้ง admin สำหรับใบจองที่ยังรอดำเนินการ
    if (plan.status === "PENDING") {
      await prisma.orderNotification.create({
        data: {
          orderId: order.id,
          orderNumber,
          customerName: DEMO_USER.name,
          customerNickname: DEMO_USER.nickname,
          totalItems: plan.items.length,
          createdAt,
        },
      })
    }
  }

  // ── ใบเสนอราคาตัวอย่าง 2 ใบ ──
  const quotableOrders = createdOrders.filter((o) => o.status !== "CANCELLED").slice(0, 2)

  for (const [index, order] of quotableOrders.entries()) {
    const items = await prisma.orderItem.findMany({ where: { orderId: order.id } })

    const quotationItems = items.map((item, i) => {
      const unitPrice = 1500 + i * 850
      return {
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice,
        amount: unitPrice * item.quantity,
        sortOrder: i,
      }
    })

    const subtotal = quotationItems.reduce((sum, i) => sum + i.amount, 0)
    const vatAmount = Math.round(subtotal * 0.07 * 100) / 100
    const baseNumber = `QT-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 15)

    await prisma.quotation.create({
      data: {
        quotationNumber: baseNumber,
        baseNumber,
        orderId: order.id,
        subtotal,
        includeVat: true,
        vatPercent: 7,
        vatAmount,
        totalAmount: subtotal + vatAmount,
        validDays: 15,
        validUntil,
        // ใบแรกส่งให้ลูกค้าแล้วและยังตอบได้ เพื่อให้ลองกดยอมรับได้ทันทีหลัง seed
        status: index === 0 ? "SENT" : "DRAFT",
        sentAt: index === 0 ? daysAgo(1) : null,
        createdBy: admin.id,
        createdByName: ADMIN.name,
        items: { create: quotationItems },
      },
    })
  }

  // ── เรื่องแจ้งปัญหา ──
  const issuePlans = [
    {
      subject: "กล้องตัวที่สั่งไปยังไม่ได้รับ",
      category: "BOOKING" as const,
      status: "PENDING" as const,
      description:
        "สั่งจองไว้เมื่อสัปดาห์ที่แล้ว ยังไม่ได้รับการติดต่อกลับเลยครับ รบกวนตรวจสอบให้หน่อย",
      days: 2,
      response: null,
    },
    {
      subject: "เข้าสู่ระบบไม่ได้หลังเปลี่ยนรหัสผ่าน",
      category: "ACCOUNT" as const,
      status: "IN_PROGRESS" as const,
      description: "เปลี่ยนรหัสผ่านใหม่แล้วเข้าระบบไม่ได้ ขึ้นว่าอีเมลหรือรหัสผ่านไม่ถูกต้อง",
      days: 6,
      response: "ทีมงานกำลังตรวจสอบให้อยู่ครับ จะติดต่อกลับภายในวันนี้",
    },
    {
      subject: "อยากทราบว่าสินค้ารับประกันกี่ปี",
      category: "OTHER" as const,
      status: "CLOSED" as const,
      description: "สอบถามเงื่อนไขการรับประกันสินค้าในหมวดกล้องวงจรปิดครับ",
      days: 15,
      response: "สินค้าทุกชิ้นรับประกัน 2 ปีนับจากวันที่รับสินค้าครับ",
    },
  ]

  for (const [index, plan] of issuePlans.entries()) {
    const createdAt = daysAgo(plan.days)
    const issueNumber = `ISS-${createdAt.getFullYear()}-${String(index + 1).padStart(4, "0")}`

    const issue = await prisma.contactIssue.create({
      data: {
        issueNumber,
        userId: demoUser.id,
        subject: plan.subject,
        category: plan.category,
        description: plan.description,
        imageUrls: [],
        status: plan.status,
        adminResponse: plan.response,
        respondedAt: plan.response ? daysAgo(plan.days - 1) : null,
        createdAt,
        updatedAt: createdAt,
      },
    })

    if (plan.status === "PENDING") {
      await prisma.issueNotification.create({
        data: {
          issueId: issue.id,
          issueNumber,
          userName: DEMO_USER.name,
          userNickname: DEMO_USER.nickname,
          subject: plan.subject,
          createdAt,
        },
      })
    }
  }

  // ── ตะกร้าค้างไว้ให้บัญชี demo ──
  const cartProduct = productBySlug.get("camera-in-400")
  const cartPaired = productBySlug.get("poe-switch-8")
  if (cartProduct && cartPaired) {
    await prisma.cartItem.create({
      data: {
        userId: demoUser.id,
        productId: cartProduct.id,
        pairedProductId: cartPaired.id,
        quantity: 2,
      },
    })
  }

  // ── ค่าตั้งค่าระบบ ──
  await prisma.systemSettings.create({ data: { showHomePage: true } })
  await prisma.seoSettings.create({
    data: {
      siteTitle: "NineBooking — ระบบจองสินค้าออนไลน์",
      siteDescription: "ระบบจองสินค้าออนไลน์ พร้อมระบบหลังบ้านครบวงจร",
    },
  })
  await prisma.quotationSettings.create({ data: {} })
  await prisma.quotationSeller.create({
    data: { name: "ฝ่ายขาย (ตัวอย่าง)", phone: "02-000-0000", isActive: true },
  })

  await seedAuditLog(admin.id, createdOrders)
  await syncDocumentCounters()

  const counts = {
    ผู้ใช้: await prisma.user.count(),
    หมวดหมู่: await prisma.category.count(),
    สินค้า: await prisma.product.count(),
    ใบจอง: await prisma.order.count(),
    ใบเสนอราคา: await prisma.quotation.count(),
    เรื่องแจ้งปัญหา: await prisma.contactIssue.count(),
    สรุปยอดเข้าชม: await prisma.productViewSummary.count(),
  }

  console.log("\nใส่ข้อมูลตัวอย่างเรียบร้อย")
  console.table(counts)
  console.log(`
บัญชีสำหรับทดลองใช้งาน
  ผู้ดูแลระบบ  ${ADMIN.email} / ${ADMIN.password}   (เข้าที่ /admin/login)
  ผู้ใช้ทั่วไป  ${DEMO_USER.email} / ${DEMO_USER.password}   (เข้าที่ /login)
`)
}

main()
  .catch((error) => {
    console.error("ใส่ข้อมูลตัวอย่างไม่สำเร็จ:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
