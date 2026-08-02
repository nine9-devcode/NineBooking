'use client'

import { IssueHistoryItem } from './issue-history-item'
import { Loader2, Inbox } from 'lucide-react'

interface Issue {
  id: string
  issueNumber: string
  subject: string
  description: string
  category: string
  imageUrls: string[]
  status: string
  adminResponse: string | null
  respondedAt: string | null
  createdAt: string
}

interface IssueHistoryListProps {
  issues: Issue[]
  loading: boolean
}

export function IssueHistoryList({ issues, loading }: IssueHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-28 bg-secondary rounded" />
              <div className="h-5 w-20 bg-secondary rounded-full" />
            </div>
            <div className="h-4 w-3/4 bg-secondary rounded mb-2" />
            <div className="h-3 w-1/3 bg-secondary rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-12 pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-muted-foreground mb-1">
          ยังไม่มีประวัติการแจ้งปัญหา
        </h3>
        <p className="text-sm text-muted-foreground">
          เมื่อคุณแจ้งปัญหา รายการจะแสดงที่นี่
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-4">
      {issues.map((issue) => (
        <IssueHistoryItem key={issue.id} issue={issue} />
      ))}
    </div>
  )
}
