import { AlertCircle } from "lucide-react"

export function SupportHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full mb-4">
        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 font-heading">
        แจ้งปัญหา / ติดต่อทีมงาน
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        แจ้งปัญหาที่พบหรือดูสถานะการแจ้งปัญหาก่อนหน้า
      </p>
    </div>
  )
}
