import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, LucideIcon } from "lucide-react"

interface ProfileCardProps {
  title: string
  icon: LucideIcon
  onEdit?: () => void
  children: ReactNode
  hideEdit?: boolean
}

export function ProfileCard({ title, icon: Icon, onEdit, children, hideEdit = false }: ProfileCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-heading">{title}</CardTitle>
        </div>
        {!hideEdit && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="hover:bg-primary/10"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            แก้ไข
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}