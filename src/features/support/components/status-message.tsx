import { CheckCircle2 } from "lucide-react"

interface StatusMessageProps {
  status: "success" | "error" | "loading" | null
  countdown?: number
  onViewHistory?: () => void
}

export function StatusMessage({ status, countdown, onViewHistory }: StatusMessageProps) {
  if (status === "loading") {
    return (
      <div className="p-4 sm:p-5 bg-info/10 border border-info/40 rounded-lg">
        <p className="text-info text-sm sm:text-base mb-3">กำลังส่งข้อมูล...</p>
        <div className="w-full h-2 bg-info/10 rounded-full overflow-hidden">
          <div className="h-full bg-info rounded-full animate-[progress-indeterminate_1.5s_ease-in-out_infinite] relative" />
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="p-5 sm:p-6 bg-success/10 border border-success/40 rounded-lg text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-success/10 rounded-full mb-3 animate-[bounce-in_0.5s_ease-out]">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-success mb-1">ส่งแจ้งปัญหาสำเร็จ!</h3>
        <p className="text-success text-sm">ทีมงานจะตรวจสอบและติดต่อกลับโดยเร็วที่สุด</p>
        {countdown !== undefined && countdown > 0 && (
          <p className="text-success text-xs mt-2">รีเซ็ตฟอร์มใน {countdown} วินาที</p>
        )}
        {onViewHistory && (
          <button
            type="button"
            onClick={onViewHistory}
            className="mt-3 text-sm text-primary hover:text-primary underline underline-offset-2 font-medium"
          >
            ดูประวัติการแจ้งปัญหา
          </button>
        )}
      </div>
    )
  }

  return null
}
