import { randomBytes } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

/**
 * ที่เก็บไฟล์ของโปรเจกนี้คือดิสก์ในเครื่อง ไม่ผูกกับบริการภายนอก
 * ไฟล์ลงที่ public/uploads/<folder>/ แล้ว Next serve เป็น static ที่ /uploads/...
 *
 * ข้อจำกัด: บน serverless (Vercel) ระบบไฟล์เป็น ephemeral ไฟล์จะหายเมื่อ deploy ใหม่
 * ถ้าจะขึ้น production จริง ให้เขียน adapter ตัวใหม่ที่มี saveFile/deleteFile
 * หน้าตาเหมือนกัน แล้วสลับ export ในไฟล์นี้ — โค้ดส่วนที่เรียกใช้ไม่ต้องแก้
 */

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads")

export interface StoredFile {
  /** path สำหรับใช้ใน <img src> เช่น /uploads/products/17700-abc.png */
  url: string
  /** ตัวอ้างอิงสำหรับลบทีหลัง (relative path ใต้ uploads) */
  publicId: string
  fileName: string
  fileType: string
  fileSize: number
}

/** เหลือแค่ตัวอักษร ตัวเลข ขีด เพื่อกัน path traversal และชื่อไฟล์แปลกๆ */
function slugifyFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "")
  const slug = base
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 60)

  return slug || "file"
}

function extensionOf(name: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(name)
  return match ? match[1].toLowerCase() : "bin"
}

/** กันไม่ให้ folder ที่รับมาจาก request หลุดออกนอก public/uploads */
function safeFolder(folder: string): string {
  return folder
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9-_]/g, ""))
    .filter(Boolean)
    .join("/")
}

export async function saveFile(file: File, folder: string): Promise<StoredFile> {
  const dir = safeFolder(folder) || "misc"
  const ext = extensionOf(file.name)
  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}-${slugifyFileName(file.name)}.${ext}`

  const relativePath = `${dir}/${fileName}`
  const absoluteDir = path.join(UPLOAD_ROOT, dir)

  await mkdir(absoluteDir, { recursive: true })
  await writeFile(
    path.join(absoluteDir, fileName),
    Buffer.from(await file.arrayBuffer())
  )

  return {
    url: `/uploads/${relativePath}`,
    publicId: relativePath,
    fileName: file.name,
    fileType: ext,
    fileSize: file.size,
  }
}

/** รับได้ทั้ง publicId ("products/xxx.png") และ url ("/uploads/products/xxx.png") */
export async function deleteFile(publicIdOrUrl: string): Promise<boolean> {
  const relative = publicIdOrUrl.replace(/^\/?uploads\//, "")
  const absolute = path.join(UPLOAD_ROOT, relative)

  // ต้องอยู่ใต้ UPLOAD_ROOT จริงๆ เท่านั้น
  if (!absolute.startsWith(UPLOAD_ROOT)) return false

  try {
    await unlink(absolute)
    return true
  } catch (error) {
    // ไฟล์ไม่มีอยู่แล้วถือว่าสำเร็จ — ปลายทางที่ต้องการคือ "ไม่มีไฟล์นี้"
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true
    console.error("ลบไฟล์ไม่สำเร็จ:", error)
    return false
  }
}

/** ลบหลายไฟล์พร้อมกัน ใช้ตอนลบสินค้าที่มีรูปหลายรูป */
export async function deleteFiles(publicIdsOrUrls: string[]): Promise<void> {
  await Promise.all(publicIdsOrUrls.filter(Boolean).map(deleteFile))
}
