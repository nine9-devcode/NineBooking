import { AlertCircle } from 'lucide-react'

interface DescriptionTextareaProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  maxLength?: number
}

export function DescriptionTextarea({ 
  value, 
  onChange, 
  error, 
  disabled,
  maxLength = 500
}: DescriptionTextareaProps) {
  return (
    <div>
      <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
        รายละเอียดปัญหา <span className="text-destructive">*</span>
      </label>
      <textarea
        id="description"
        name="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        maxLength={maxLength}
        placeholder="อธิบายสิ่งที่เกิดขึ้น...&#10;เช่น เมื่อกดปุ่มจองแล้วหน้าจอหมุนค้าง ไม่สามารถดำเนินการต่อได้"
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors ${
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
      <p className="mt-1 text-sm text-muted-foreground">
        {value.length} / {maxLength} ตัวอักษร
      </p>
    </div>
  )
}