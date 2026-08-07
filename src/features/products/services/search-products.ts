import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"

/**
 * ค้นหาสินค้าด้วย full-text ของ Postgres
 *
 * ของเดิมใช้ `contains` + mode: insensitive ซึ่ง Prisma แปลเป็น ILIKE '%…%'
 * — sequential scan ทั้งตารางทุกครั้ง ไม่มี index ช่วยได้ ไม่มีการจัดอันดับ
 * และพิมพ์ผิดตัวเดียวก็หาไม่เจอ
 *
 * ที่นี่เป็นที่เดียวในโปรเจกที่ใช้ $queryRaw เพราะ Prisma ยังไม่รองรับ tsvector
 * และตัวดำเนินการของ pg_trgm ทุกค่าที่มาจากผู้ใช้ผูกเป็นพารามิเตอร์ผ่าน
 * Prisma.sql ไม่มีการต่อสตริงเข้า SQL เลย
 *
 * ใช้สองกลไกคู่กัน:
 *   tsvector @@ tsquery  → คำที่ตรง พร้อมคะแนนความเกี่ยวข้องตามน้ำหนักของฟิลด์
 *   pg_trgm  <%          → ทนคำสะกดผิด เช่น "กลอง" ควรเจอ "กล้อง"
 */

export interface ProductSearchHit {
  id: string
  rank: number
}

export interface SearchOptions {
  query: string
  categoryIds?: string[]
  limit?: number
  skip?: number
}

/** คำที่สั้นกว่านี้ให้ตกไปใช้ ILIKE ตามเดิม — tsquery กับหนึ่งตัวอักษรไม่มีความหมาย */
export const MIN_FULLTEXT_LENGTH = 2

/**
 * เกณฑ์ความคล้ายสำหรับการพิมพ์ผิด
 *
 * ค่าปริยายของ Postgres คือ 0.6 ซึ่งสูงเกินไปสำหรับภาษาไทย — "กลอง" กับ "กล้อง"
 * ได้แค่ 0.40 เพราะวรรณยุกต์ทำให้ไตรแกรมต่างกัน ส่วน "swithc" กับ "Switch"
 * ได้ 0.57 ตั้งไว้ที่ 0.4 จึงครอบทั้งสองกรณีโดยยังไม่กว้างจนได้ผลลัพธ์มั่ว
 */
const WORD_SIMILARITY_THRESHOLD = 0.4

/**
 * แปลงคำค้นของผู้ใช้เป็น tsquery แบบ prefix
 * "กล้อง วง" → "กล้อง:* & วง:*" ทำให้พิมพ์ไม่จบคำก็ยังเจอ
 */
function toPrefixQuery(input: string): string {
  return (
    input
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      // ตัดอักขระที่มีความหมายพิเศษใน tsquery ออก กันไม่ให้ผู้ใช้เขียน query เอง
      .map((term) => term.replace(/[!&|():*<>'"\\]/g, ""))
      .filter(Boolean)
      .map((term) => `${term}:*`)
      .join(" & ")
  )
}

export function shouldUseFullText(query: string): boolean {
  return query.trim().length >= MIN_FULLTEXT_LENGTH && toPrefixQuery(query).length > 0
}

/**
 * คืน id ของสินค้าเรียงตามความเกี่ยวข้อง
 *
 * แยกเป็นสองขั้น (หา id ก่อน แล้วค่อยดึงรายละเอียดด้วย Prisma ปกติ)
 * เพื่อไม่ต้องเขียน SQL ของ join และ select ทั้งหมดเอง — ส่วนที่ raw จริงๆ
 * จึงเล็กและตรวจสอบง่าย
 */
export async function searchProductIds({
  query,
  categoryIds,
  limit = 12,
  skip = 0,
}: SearchOptions): Promise<{ hits: ProductSearchHit[]; total: number }> {
  const tsQuery = toPrefixQuery(query)
  const categoryFilter =
    categoryIds && categoryIds.length > 0
      ? Prisma.sql`AND "categoryId" IN (${Prisma.join(categoryIds)})`
      : Prisma.empty

  const matches = Prisma.sql`
    "isActive" = true
    ${categoryFilter}
    AND (
      "searchVector" @@ to_tsquery('simple', ${tsQuery})
      OR ${query} <% "name"
      OR ${query} <% coalesce("subtitle", '')
    )
  `

  // ต้องอยู่ในทรานแซกชันเดียวกับ SET LOCAL
  //
  // ตัวดำเนินการ <% อ่านเกณฑ์จาก pg_trgm.word_similarity_threshold ซึ่งเป็นค่า
  // ระดับ session ตั้งไว้ล่วงหน้าไม่ได้เพราะ Prisma ใช้ connection pool —
  // แต่ละ query อาจได้คนละ connection ที่ยังเป็นค่าปริยาย
  // SET LOCAL ผูกกับทรานแซกชัน จึงได้ผลเหมือนกันทุกครั้ง และยังใช้ GIN index ได้
  // (ถ้าเขียนเป็น word_similarity(...) > 0.4 ตรงๆ จะเดาผลได้เหมือนกัน
  //  แต่ index ใช้ไม่ได้ กลายเป็น seq scan)
  const [rows, countRows] = await prisma
    .$transaction([
      // ใช้ set_config แทน SET LOCAL เพราะ SET รับ bind parameter ไม่ได้
      // อาร์กิวเมนต์ตัวที่สาม = true หมายถึงมีผลเฉพาะทรานแซกชันนี้
      prisma.$queryRaw`SELECT set_config('pg_trgm.word_similarity_threshold', ${String(WORD_SIMILARITY_THRESHOLD)}, true)`,
      prisma.$queryRaw<Array<{ id: string; rank: number }>>(Prisma.sql`
      SELECT
        "id",
        ts_rank("searchVector", to_tsquery('simple', ${tsQuery}))
          + word_similarity(${query}, "name") AS "rank"
      FROM "Product"
      WHERE ${matches}
      ORDER BY "rank" DESC, "viewCount" DESC
      LIMIT ${limit} OFFSET ${skip}
    `),
      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count" FROM "Product" WHERE ${matches}
    `),
    ])
    .then(([, hits, counts]) => [hits, counts] as const)

  return {
    hits: rows.map((row) => ({ id: row.id, rank: Number(row.rank) })),
    total: Number(countRows[0]?.count ?? 0),
  }
}
