// components/checkout/notes-section.tsx

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText } from "lucide-react"

interface NotesSectionProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
}

export function NotesSection({ value, onChange, isLoading }: NotesSectionProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          หมายเหตุเพิ่มเติม
        </h2>
        <span className="text-sm text-muted-foreground">(ถ้ามี)</span>
      </div>

      {/* Textarea */}
      <Textarea
        id="customerNote"
        name="customerNote"
        value={value}
        onChange={onChange}
        placeholder="หมายเหตุหรือข้อความถึงบริษัท..."
        rows={3}
        disabled={isLoading}
      />
    </div>
  )
}