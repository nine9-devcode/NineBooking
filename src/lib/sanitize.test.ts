import { describe, expect, it } from "vitest"

import { sanitizeRichText } from "./sanitize"

describe("sanitizeRichText", () => {
  it("เก็บการจัดรูปแบบปกติของ rich text editor ไว้", () => {
    const html = "<p>สินค้า <strong>รุ่นใหม่</strong> พร้อม<em>ส่ง</em></p><ul><li>ข้อ 1</li></ul>"

    expect(sanitizeRichText(html)).toBe(html)
  })

  it("ตัด <script> ทั้งแท็กและเนื้อข้างใน", () => {
    const output = sanitizeRichText("<p>ก่อน</p><script>alert(1)</script><p>หลัง</p>")

    expect(output).toBe("<p>ก่อน</p><p>หลัง</p>")
    expect(output).not.toContain("alert")
  })

  it("ตัด attribute ที่เป็น event handler ออก", () => {
    expect(sanitizeRichText('<p onclick="steal()">ข้อความ</p>')).toBe("<p>ข้อความ</p>")
  })

  it("ตัดแท็กที่ไม่อยู่ใน allowlist เช่น <img onerror>", () => {
    const output = sanitizeRichText('<p>ดู</p><img src=x onerror="alert(1)">')

    expect(output).toBe("<p>ดู</p>")
  })

  it("ตัดลิงก์ javascript: ทิ้ง แต่เก็บ href ปกติไว้", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">กด</a>')).toBe("<a>กด</a>")
    expect(sanitizeRichText('<a href="https://example.com">กด</a>')).toBe(
      '<a href="https://example.com">กด</a>'
    )
  })

  it("เติม rel ให้ลิงก์ที่เปิดแท็บใหม่ กัน tabnabbing", () => {
    expect(sanitizeRichText('<a href="/x" target="_blank">กด</a>')).toContain(
      'rel="noopener noreferrer"'
    )
  })

  it("ปล่อยผ่าน style เฉพาะ text-align ที่ Tiptap ใช้", () => {
    expect(sanitizeRichText('<p style="text-align: center">กลาง</p>')).toBe(
      '<p style="text-align: center">กลาง</p>'
    )
    expect(sanitizeRichText('<p style="position:fixed;top:0">ทับหน้าจอ</p>')).toBe(
      "<p>ทับหน้าจอ</p>"
    )
  })

  it("ตัด iframe และ comment ที่ซ่อน payload ได้", () => {
    expect(sanitizeRichText('<iframe src="//evil"></iframe><!-- <script> -->')).toBe("")
  })

  it("รับค่าว่างและ null ได้", () => {
    expect(sanitizeRichText("")).toBe("")
    expect(sanitizeRichText(null)).toBe("")
    expect(sanitizeRichText(undefined)).toBe("")
  })
})
