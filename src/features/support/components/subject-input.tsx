import { AlertCircle } from 'lucide-react'

interface SubjectInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function SubjectInput({ value, onChange, error, disabled }: SubjectInputProps) {
  return (
    <div>
      <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
        หัวข้อปัญหา <span className="text-destructive">*</span>
      </label>
      <input
        type="text"
        id="subject"
        name="subject"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="เช่น ระบบจองไม่ทำงาน, ไม่สามารถเข้าสู่ระบบได้"
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? 'border-destructive/40' : 'border-border'
        }`}
        disabled={disabled}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}