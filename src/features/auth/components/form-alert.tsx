import { AlertCircle, CheckCircle2, Info } from "lucide-react"

type Tone = "error" | "success" | "info"

const TONE_STYLES: Record<Tone, string> = {
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  success: "border-success/40 bg-success/10 text-success",
  info: "border-info/40 bg-info/10 text-info",
}

const TONE_ICONS: Record<Tone, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
}

/** กล่องข้อความสถานะในฟอร์ม ใช้สีจาก token ทั้งหมด */
export function FormAlert({
  tone = "info",
  children,
}: {
  tone?: Tone
  children: React.ReactNode
}) {
  if (!children) return null

  const Icon = TONE_ICONS[tone]

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-md border p-3 text-sm ${TONE_STYLES[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
