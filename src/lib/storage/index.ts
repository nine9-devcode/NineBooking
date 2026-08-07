import { randomBytes } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

/**
 * ที่เก็บไฟล์ของโปรเจกนี้คือดิสก์ในเครื่อง ไม่ผูกกับบริการภายนอก
 *
 * มีสองที่เก็บ:
 *   public/uploads/   → Next serve เป็น static ที่ /uploads/... ใครก็เปิดได้
 *   private-uploads/  → ไม่มีใครเปิดตรงๆ ได้ ต้องผ่าน /api/files ที่เช็คสิทธิ์ก่อน
 *
 * รูปสินค้า/หมวดหมู่ที่แอดมินอัปเป็น public ได้ แต่ไฟล์แนบของลูกค้า
 * (สกรีนช็อตในเรื่องร้องเรียน มักมีเลขออเดอร์ ที่อยู่ เบอร์โทร) ต้องเป็น private
 *
 * ข้อจำกัด: บน serverless (Vercel) ระบบไฟล์เป็น ephemeral ไฟล์จะหายเมื่อ deploy ใหม่
 * ถ้าจะขึ้น production จริง ให้เขียน adapter ตัวใหม่ที่มี saveFile/deleteFile
 * หน้าตาเหมือนกัน แล้วสลับ export ในไฟล์นี้ — โค้ดส่วนที่เรียกใช้ไม่ต้องแก้
 */

const PUBLIC_ROOT = path.join(process.cwd(), "public", "uploads")
const PRIVATE_ROOT = path.join(process.cwd(), "private-uploads")

export type FileKind = "image" | "document"
export type Visibility = "public" | "private"

export interface SaveOptions {
  /** หมวดไฟล์ที่ยอมรับ — ไฟล์ที่ sniff ได้ต่างหมวดจะถูกปฏิเสธ */
  kind: FileKind
  maxBytes: number
  /** ค่าเริ่มต้น public — ไฟล์ที่ลูกค้าอัปควรเป็น private */
  visibility?: Visibility
}

export interface StoredFile {
  /**
   * public  → "/uploads/products/17700-abc.png" ใช้ใน <img src> ตรงๆ ได้
   * private → "/api/files/support-issues/17700-abc.png" ต้องผ่าน route ที่เช็คสิทธิ์
   */
  url: string
  /** ตัวอ้างอิงสำหรับลบทีหลัง (relative path ใต้ root ของ visibility นั้น) */
  publicId: string
  /** ชื่อไฟล์ที่ผู้ใช้อัปมา — ใช้แสดงผลเท่านั้น ห้ามเอาไปประกอบเป็น path */
  fileName: string
  /** นามสกุลที่ระบบกำหนดเองจากเนื้อไฟล์จริง ไม่ใช่จากชื่อที่ client ส่งมา */
  fileType: string
  fileSize: number
}

/** โยนตัวนี้เมื่อไฟล์ไม่ผ่านเกณฑ์ — route จะแปลงเป็น 400 พร้อมข้อความไทย */
export class UploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UploadError"
  }
}

// ─────────────────────────────────────────────────────────────
// ตรวจชนิดไฟล์จากเนื้อไฟล์จริง
// ─────────────────────────────────────────────────────────────

/**
 * นี่คือหัวใจของการกันช่องโหว่
 *
 * เดิมโค้ดเอานามสกุลจาก file.name (client ตั้งเองได้) และเช็คชนิดจาก file.type
 * ซึ่งเป็น Content-Type ของ multipart part ที่ client ก็ตั้งเองได้เหมือนกัน
 * ผลคือส่งไฟล์ชื่อ "x.html" ที่ประกาศว่าเป็น image/png แต่ข้างในเป็น <script>
 * ได้ ไฟล์ไปวางใน public/ แล้วถูก serve เป็น text/html บน origin เดียวกับเว็บ
 * → สคริปต์ของคนอื่นรันด้วยสิทธิ์ของคนที่เปิดลิงก์ (nosniff ช่วยไม่ได้
 *   เพราะนามสกุลเป็น .html จริงๆ ไม่ได้เกิดจากการเดาชนิด)
 *
 * ทางแก้: อ่าน magic bytes แล้วให้ "ตารางนี้" เป็นแหล่งเดียวของนามสกุล
 * ชื่อไฟล์จาก client ใช้ได้แค่เป็นส่วนประกอบของชื่อที่อ่านออกเท่านั้น
 */
interface Signature {
  kind: FileKind
  /** MIME ที่ยอมให้ประกาศคู่กับลายเซ็นนี้ ตัวแรกคือค่าปริยาย */
  mimes: string[]
  /** นามสกุลที่จะใช้จริง เรียงคู่กับ mimes */
  exts: string[]
  test: (bytes: Buffer) => boolean
}

const ascii = (bytes: Buffer, start: number, length: number) =>
  bytes.subarray(start, start + length).toString("latin1")

const startsWith = (bytes: Buffer, ...prefix: number[]) =>
  prefix.every((byte, i) => bytes[i] === byte)

const SIGNATURES: Signature[] = [
  {
    kind: "image",
    mimes: ["image/jpeg"],
    exts: ["jpg"],
    test: (b) => startsWith(b, 0xff, 0xd8, 0xff),
  },
  {
    kind: "image",
    mimes: ["image/png"],
    exts: ["png"],
    test: (b) => startsWith(b, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  },
  {
    kind: "image",
    mimes: ["image/gif"],
    exts: ["gif"],
    test: (b) => ascii(b, 0, 4) === "GIF8",
  },
  {
    kind: "image",
    mimes: ["image/webp"],
    exts: ["webp"],
    test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP",
  },
  {
    kind: "image",
    mimes: ["image/avif"],
    exts: ["avif"],
    // ISO-BMFF: ขนาดกล่อง 4 ไบต์ แล้วตามด้วย "ftyp" และ brand
    test: (b) => ascii(b, 4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 4)),
  },
  {
    kind: "document",
    mimes: ["application/pdf"],
    exts: ["pdf"],
    test: (b) => ascii(b, 0, 4) === "%PDF",
  },
  {
    kind: "document",
    // docx/xlsx เป็น ZIP ทั้งคู่ แยกจาก magic bytes ไม่ได้
    // จึงให้ค่าที่ client ประกาศมาเป็นตัวเลือกได้ แต่เลือกได้แค่ในลิสต์นี้
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    exts: ["docx", "xlsx"],
    test: (b) => startsWith(b, 0x50, 0x4b, 0x03, 0x04),
  },
  {
    kind: "document",
    // OLE2 compound document — .doc กับ .xls รูปแบบเก่า แยกจาก header ไม่ได้เช่นกัน
    mimes: ["application/msword", "application/vnd.ms-excel"],
    exts: ["doc", "xls"],
    test: (b) => startsWith(b, 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
  },
]

export interface SniffedType {
  mime: string
  ext: string
  kind: FileKind
}

/**
 * คืนชนิดไฟล์จริงจาก magic bytes — คืน null ถ้าไม่ตรงลายเซ็นไหนเลย
 * declaredMime ใช้แค่เลือกในกลุ่มที่ลายเซ็นเดียวกันครอบคลุมหลายชนิด (ZIP/OLE2)
 */
export function sniffFileType(bytes: Buffer, declaredMime?: string): SniffedType | null {
  const match = SIGNATURES.find((sig) => sig.test(bytes))
  if (!match) return null

  const index = declaredMime ? match.mimes.indexOf(declaredMime) : -1
  const resolved = index >= 0 ? index : 0

  return { mime: match.mimes[resolved], ext: match.exts[resolved], kind: match.kind }
}

// ─────────────────────────────────────────────────────────────
// ชื่อไฟล์และโฟลเดอร์
// ─────────────────────────────────────────────────────────────

/** เหลือแค่ตัวอักษร ตัวเลข ขีด — ใช้เป็นส่วนที่อ่านออกของชื่อไฟล์เท่านั้น */
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

/** กันไม่ให้ folder ที่รับมาจาก request หลุดออกนอก root */
function safeFolder(folder: string): string {
  return folder
    .split("/")
    .map((part) => part.replace(/[^a-zA-Z0-9-_]/g, ""))
    .filter(Boolean)
    .join("/")
}

function rootFor(visibility: Visibility): string {
  return visibility === "private" ? PRIVATE_ROOT : PUBLIC_ROOT
}

/** path ต้องอยู่ใต้ root จริงๆ — เทียบแบบมี separator กัน "/uploads-backup" หลุดผ่าน */
function isInside(absolute: string, root: string): boolean {
  return absolute === root || absolute.startsWith(root + path.sep)
}

// ─────────────────────────────────────────────────────────────

export async function saveFile(
  file: File,
  folder: string,
  options: SaveOptions
): Promise<StoredFile> {
  const { kind, maxBytes, visibility = "public" } = options

  if (file.size === 0) throw new UploadError("ไฟล์ว่างเปล่า")
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    throw new UploadError(`ไฟล์ใหญ่เกินไป (สูงสุด ${mb} MB)`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sniffed = sniffFileType(buffer, file.type)

  if (!sniffed) {
    throw new UploadError("ไฟล์นี้ไม่ใช่ชนิดที่รองรับ")
  }

  if (sniffed.kind !== kind) {
    throw new UploadError(
      kind === "image"
        ? "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, AVIF, GIF)"
        : "รองรับเฉพาะไฟล์เอกสาร (PDF, DOC, DOCX, XLS, XLSX)"
    )
  }

  const dir = safeFolder(folder) || "misc"
  // นามสกุลมาจาก sniffed เท่านั้น — ไม่แตะ file.name
  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}-${slugifyFileName(file.name)}.${sniffed.ext}`

  const root = rootFor(visibility)
  const absoluteDir = path.join(root, dir)
  const absoluteFile = path.join(absoluteDir, fileName)

  if (!isInside(absoluteFile, root)) {
    throw new UploadError("ปลายทางของไฟล์ไม่ถูกต้อง")
  }

  await mkdir(absoluteDir, { recursive: true })
  await writeFile(absoluteFile, buffer)

  const relativePath = `${dir}/${fileName}`

  return {
    url: visibility === "private" ? `/api/files/${relativePath}` : `/uploads/${relativePath}`,
    publicId: relativePath,
    fileName: file.name,
    fileType: sniffed.ext,
    fileSize: file.size,
  }
}

/**
 * แปลง url หรือ publicId กลับเป็น absolute path ที่ปลอดภัย
 * คืน null ถ้าชี้ออกนอก root — ใช้ทั้งตอนลบและตอน /api/files อ่านไฟล์
 */
export function resolveStoredPath(
  publicIdOrUrl: string,
  visibility: Visibility = "public"
): string | null {
  const relative = publicIdOrUrl.replace(/^\/?(uploads|api\/files)\//, "")
  const root = rootFor(visibility)
  const absolute = path.join(root, relative)

  return isInside(absolute, root) ? absolute : null
}

/** รับได้ทั้ง publicId ("products/xxx.png") และ url ("/uploads/products/xxx.png") */
export async function deleteFile(
  publicIdOrUrl: string,
  visibility: Visibility = "public"
): Promise<boolean> {
  const absolute = resolveStoredPath(publicIdOrUrl, visibility)
  if (!absolute) return false

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
export async function deleteFiles(
  publicIdsOrUrls: string[],
  visibility: Visibility = "public"
): Promise<void> {
  await Promise.all(
    publicIdsOrUrls.filter(Boolean).map((id) => deleteFile(id, visibility))
  )
}

/** Content-Type ที่ยอมให้ /api/files ส่งกลับ — ปิดท้ายอีกชั้นไม่ให้ serve HTML */
export const SERVEABLE_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
