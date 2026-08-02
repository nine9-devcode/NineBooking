import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface SupportFormCardProps {
  children: ReactNode
}

export function SupportFormCard({ children }: SupportFormCardProps) {
  return (
    <Card className="bg-card shadow-sm">
      <CardContent className="space-y-6 p-4 sm:p-6 lg:p-8">
        {children}
      </CardContent>
    </Card>
  )
}
