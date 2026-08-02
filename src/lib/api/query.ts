/**
 * ตัวช่วยอ่านค่าจาก query string ให้ได้ type ที่ถูกต้อง
 * แทนการ cast ตรงๆ ซึ่งจะปล่อยค่าที่ไม่มีอยู่จริงหลุดเข้าไปถึง Prisma
 */

/**
 * แปลงค่าจาก query string เป็น enum ของ Prisma
 * คืน undefined เมื่อไม่ได้ส่งมา, ส่งมาเป็น "all" หรือค่าไม่ตรงกับ enum
 * (undefined = ไม่กรอง ซึ่งเป็นพฤติกรรมที่ถูกต้องของ Prisma)
 */
export function parseEnumParam<T extends Record<string, string>>(
  enumObject: T,
  value: string | null | undefined
): T[keyof T] | undefined {
  if (!value || value === "all") return undefined

  const allowed = Object.values(enumObject) as string[]
  return allowed.includes(value) ? (value as T[keyof T]) : undefined
}

/** อ่านเลขหน้า/จำนวนต่อหน้า พร้อมกันค่าติดลบและค่าที่ใหญ่เกินไป */
export function parsePagination(
  searchParams: URLSearchParams,
  { defaultLimit = 10, maxLimit = 100 } = {}
) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const rawLimit =
    Number.parseInt(searchParams.get("limit") ?? String(defaultLimit), 10) || defaultLimit
  const limit = Math.min(Math.max(1, rawLimit), maxLimit)

  return { page, limit, skip: (page - 1) * limit }
}
