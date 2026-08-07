/**
 * ล้าง HTML จาก rich text editor ก่อนบันทึกลงฐานข้อมูล
 *
 * ทำไมต้องล้างตอนเขียน ไม่ใช่ตอนอ่าน: ฝั่งแสดงผลใช้ DOMPurify ใน component
 * ที่เป็น "use client" ซึ่งตอน server-render ไม่มี DOM ให้ทำงาน ตัวมันจึงเป็น
 * no-op ในรอบแรกที่ HTML ถูกส่งออกไป — สคริปต์รันไปแล้วก่อนที่ hydration จะเกิด
 * ล้างที่ต้นทางครั้งเดียวจึงทั้งถูกกว่าและกันได้จริง
 *
 * ใช้ allowlist ของแท็กและ attribute แทนการไล่ลบสิ่งที่อันตราย เพราะ
 * blocklist มักมีช่องที่นึกไม่ถึงเสมอ
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "a", "span", "div", "hr",
  "table", "thead", "tbody", "tr", "th", "td",
])

/** style ปล่อยผ่านเฉพาะ text-align ที่ extension ของ Tiptap ใช้ */
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  span: new Set(["style"]),
  p: new Set(["style"]),
  h1: new Set(["style"]),
  h2: new Set(["style"]),
  h3: new Set(["style"]),
  h4: new Set(["style"]),
  h5: new Set(["style"]),
  h6: new Set(["style"]),
}

const SAFE_STYLE = /^text-align:\s*(left|right|center|justify);?$/i
const SAFE_HREF = /^(https?:|mailto:|tel:|\/)/i

/** ลบทั้งแท็กและเนื้อข้างใน — ของพวกนี้ไม่ควรมีในคำอธิบายสินค้าเลย */
const STRIP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi

function sanitizeAttributes(tag: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tag]
  if (!allowed) return ""

  const kept: string[] = []
  const attrPattern = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g

  let match: RegExpExecArray | null
  while ((match = attrPattern.exec(rawAttrs)) !== null) {
    const name = (match[1] ?? match[3] ?? "").toLowerCase()
    const value = match[2] ?? match[4] ?? ""

    if (!allowed.has(name)) continue
    if (name === "style" && !SAFE_STYLE.test(value.trim())) continue
    // กัน javascript: และ data: ที่พาไปรันสคริปต์ได้
    if (name === "href" && !SAFE_HREF.test(value.trim())) continue

    kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`)
  }

  // ลิงก์ที่เปิดแท็บใหม่ต้องมี rel กัน tabnabbing
  if (tag === "a" && kept.some((a) => a.startsWith('target="_blank"'))) {
    if (!kept.some((a) => a.startsWith("rel="))) {
      kept.push('rel="noopener noreferrer"')
    }
  }

  return kept.length ? " " + kept.join(" ") : ""
}

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return ""

  return html
    .replace(STRIP_WITH_CONTENT, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g, (_, slash, rawTag, attrs) => {
      const tag = String(rawTag).toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) return ""
      if (slash) return `</${tag}>`

      return `<${tag}${sanitizeAttributes(tag, String(attrs))}>`
    })
    // แท็กที่เหลือ (เช่น <img onerror=...> ที่ไม่อยู่ใน allowlist) ถูกลบไปแล้ว
    // ปัดเศษ < ที่ลอยอยู่เดี่ยวๆ ทิ้งด้วย
    .replace(/<(?![a-zA-Z/])/g, "&lt;")
}
