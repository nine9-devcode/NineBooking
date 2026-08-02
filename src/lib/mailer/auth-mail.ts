import { siteConfig } from "@/config/site"
import { mailer } from "@/lib/mailer"
import { RESET_TOKEN_TTL_MINUTES } from "@/features/auth/password-reset"

/** เทมเพลตอีเมลตั้งรหัสผ่านใหม่ — HTML ตรงๆ เพราะเป็นข้อความสั้นๆ ไม่ต้องใช้ react-email */
function resetPasswordHtml(name: string, resetUrl: string): string {
  return `
<div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#1f2937">
  <h1 style="font-size:20px;margin:0 0 16px">ตั้งรหัสผ่านใหม่</h1>
  <p style="margin:0 0 12px">สวัสดีครับ คุณ${name}</p>
  <p style="margin:0 0 20px;line-height:1.7">
    เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณที่ ${siteConfig.name}
    กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์นี้ใช้ได้ภายใน ${RESET_TOKEN_TTL_MINUTES} นาที และใช้ได้ครั้งเดียว
  </p>
  <p style="margin:0 0 24px">
    <a href="${resetUrl}"
       style="display:inline-block;background:#4b7bec;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
      ตั้งรหัสผ่านใหม่
    </a>
  </p>
  <p style="margin:0 0 8px;font-size:13px;color:#6b7280">ถ้าปุ่มกดไม่ได้ ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
  <p style="margin:0 0 24px;font-size:13px;word-break:break-all;color:#4b7bec">${resetUrl}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="margin:0;font-size:13px;color:#6b7280">
    ถ้าคุณไม่ได้เป็นคนขอ ไม่ต้องทำอะไรครับ รหัสผ่านเดิมยังใช้งานได้ตามปกติ
  </p>
</div>`.trim()
}

export async function sendPasswordResetEmail(params: {
  to: string
  name: string
  token: string
}) {
  const resetUrl = `${siteConfig.url}/reset-password?token=${params.token}`

  return mailer.send({
    to: params.to,
    subject: `ตั้งรหัสผ่านใหม่ — ${siteConfig.name}`,
    html: resetPasswordHtml(params.name, resetUrl),
  })
}
