import { readFile } from "node:fs/promises"
import path from "node:path"

import { auth } from "@/lib/auth"
import { forbidden, notFound, unauthorized } from "@/lib/api/response"
import { prisma } from "@/lib/db"
import { SERVEABLE_CONTENT_TYPES, resolveStoredPath } from "@/lib/storage"

/**
 * เสิร์ฟไฟล์ที่ไม่ควรเปิดสาธารณะ (ตอนนี้คือรูปแนบในเรื่องแจ้งปัญหา)
 *
 * เดิมไฟล์พวกนี้อยู่ใน public/uploads/ ซึ่ง Next serve เป็น static
 * และ matcher ของ middleware ก็ยกเว้น /uploads ไว้ ผลคือใครเดา URL ถูก
 * ก็เปิดดูสกรีนช็อตของลูกค้าคนอื่นได้ ทั้งที่ในนั้นมักมีเลขออเดอร์ ที่อยู่ เบอร์โทร
 *
 * ตอนนี้ไฟล์อยู่นอก public/ และต้องผ่าน route นี้ซึ่งเช็คว่าเป็นเจ้าของเรื่อง
 * หรือเป็นแอดมินเท่านั้น
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session?.user) return unauthorized()

  const { path: segments } = await params
  const relative = segments.join("/")

  const absolute = resolveStoredPath(relative, "private")
  if (!absolute) return forbidden()

  const ext = path.extname(absolute).slice(1).toLowerCase()
  const contentType = SERVEABLE_CONTENT_TYPES[ext]

  // ปิดท้ายอีกชั้น: ต่อให้มีไฟล์แปลกๆ หลุดเข้าไปในโฟลเดอร์ ก็ไม่ถูกส่งออกไป
  if (!contentType) return notFound("ไฟล์")

  const isOwner = await canAccess(relative, session.user.id, session.user.role === "admin")
  if (!isOwner) return forbidden()

  try {
    const buffer = await readFile(absolute)

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        // ไม่ให้ CDN/proxy สาธารณะเก็บไว้ เพราะเป็นไฟล์เฉพาะบุคคล
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${path.basename(absolute)}"`,
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return notFound("ไฟล์")
  }
}

/** แอดมินดูได้ทุกไฟล์ ผู้ใช้ทั่วไปดูได้เฉพาะไฟล์ที่แนบมากับเรื่องของตัวเอง */
async function canAccess(
  relative: string,
  userId: string,
  isAdmin: boolean
): Promise<boolean> {
  if (isAdmin) return true

  const url = `/api/files/${relative}`

  const owned = await prisma.contactIssue.findFirst({
    where: { userId, imageUrls: { has: url } },
    select: { id: true },
  })

  return owned !== null
}
