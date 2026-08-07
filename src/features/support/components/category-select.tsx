import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  Bug,
  UserCircle,
  HelpCircle,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CATEGORIES = [
  { value: "BOOKING", label: "การจอง", icon: CalendarDays },
  { value: "PAYMENT", label: "การชำระเงิน", icon: CreditCard },
  { value: "USAGE_ISSUE", label: "ปัญหาการใช้งาน", icon: Bug },
  { value: "ACCOUNT", label: "บัญชีผู้ใช้", icon: UserCircle },
  { value: "OTHER", label: "อื่นๆ", icon: HelpCircle },
] as const

export const CATEGORY_MAP: Record<string, { label: string; icon: typeof CalendarDays }> = {
  BOOKING: { label: "การจอง", icon: CalendarDays },
  PAYMENT: { label: "การชำระเงิน", icon: CreditCard },
  USAGE_ISSUE: { label: "ปัญหาการใช้งาน", icon: Bug },
  ACCOUNT: { label: "บัญชีผู้ใช้", icon: UserCircle },
  OTHER: { label: "อื่นๆ", icon: HelpCircle },
}

interface CategorySelectProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function CategorySelect({ value, onChange, error, disabled }: CategorySelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        ประเภทปัญหา <span className="text-destructive">*</span>
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full px-4 py-3 h-auto text-sm ${
            error ? "border-destructive/40" : "border-border"
          } rounded-lg focus:ring-2 focus:ring-primary`}
        >
          <SelectValue placeholder="เลือกประเภทปัญหา" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <SelectItem key={cat.value} value={cat.value}>
                <Icon className="w-4 h-4 text-muted-foreground" />
                {cat.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      {error && (
        <p className="mt-1 text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}
