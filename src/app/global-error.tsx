"use client"

/**
 * ด่านสุดท้ายเมื่อ error เกิดใน root layout เอง
 *
 * ตอนนี้ layout ปกติใช้ไม่ได้แล้ว ไฟล์นี้จึงต้องมี <html> และ <body> ของตัวเอง
 * และห้ามพึ่งพา CSS ของโปรเจกเพราะอาจเป็นตัวที่พังเสียเอง — จัดสไตล์แบบ inline
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#0f1424",
          color: "#f2f4fb",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>ระบบขัดข้อง</h1>
        <p
          style={{ maxWidth: 420, fontSize: 14, color: "#a9b3d0", margin: 0, lineHeight: 1.7 }}
        >
          เกิดข้อผิดพลาดร้ายแรงจนแสดงหน้าเว็บตามปกติไม่ได้ กรุณาลองโหลดใหม่อีกครั้งครับ
        </p>
        {error.digest && (
          <p style={{ fontSize: 12, color: "#7b87a8", margin: 0 }}>
            รหัสอ้างอิง: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "#5b8cf5",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          ลองใหม่
        </button>
      </body>
    </html>
  )
}
