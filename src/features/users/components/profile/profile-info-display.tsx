interface ProfileInfoDisplayProps {
  label: string
  value: string | null
}

export function ProfileInfoDisplay({ label, value }: ProfileInfoDisplayProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || "-"}</p>
    </div>
  )
}
