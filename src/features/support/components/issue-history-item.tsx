'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_MAP } from './category-select'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Image as ImageIcon,
} from 'lucide-react'
import type { IssueStatus } from "@prisma/client"
import { ISSUE_STATUS } from "@/components/ui/status-badge"

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

interface IssueHistoryItemProps {
  issue: Issue
}

export function IssueHistoryItem({ issue }: IssueHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = ISSUE_STATUS[issue.status as IssueStatus] ?? ISSUE_STATUS.PENDING
  const StatusIcon = statusConfig.icon
  const categoryInfo = CATEGORY_MAP[issue.category]

  const formattedDate = new Date(issue.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const respondedDate = issue.respondedAt
    ? new Date(issue.respondedAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden transition-shadow hover:shadow-md">
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Issue number + status */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                {issue.issueNumber}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${statusConfig.className}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
            </div>

            {/* Category + Subject */}
            <div className="flex items-center gap-2 mb-1">
              {categoryInfo && (
                <Badge variant="secondary" className="text-xs">
                  {categoryInfo.label}
                </Badge>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-medium text-foreground truncate">
              {issue.subject}
            </h3>

            {/* Date */}
            <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
          </div>

          {/* Expand indicator */}
          <div className="flex items-center gap-2 mt-1">
            {issue.adminResponse && (
              <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                <MessageSquareText className="w-3 h-3" />
                ตอบแล้ว
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border px-4 sm:px-5 pb-4 sm:pb-5 pt-3 space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              รายละเอียด
            </h4>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted rounded-lg p-3">
              {issue.description}
            </p>
          </div>

          {/* Images */}
          {issue.imageUrls && issue.imageUrls.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                ภาพประกอบ ({issue.imageUrls.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {issue.imageUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square bg-muted rounded-lg border border-border overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`ภาพประกอบ ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin Response */}
          {issue.adminResponse && (
            <div className="bg-success/10 border border-success/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareText className="w-4 h-4 text-success" />
                <h4 className="text-sm font-semibold text-success">
                  การตอบกลับจากทีมงาน
                </h4>
              </div>
              <p className="text-sm text-success whitespace-pre-wrap leading-relaxed">
                {issue.adminResponse}
              </p>
              {respondedDate && (
                <p className="text-xs text-success mt-2">{respondedDate}</p>
              )}
            </div>
          )}

          {/* No response yet */}
          {!issue.adminResponse && issue.status !== 'CLOSED' && (
            <div className="bg-muted border border-border rounded-lg p-4 text-center">
              <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">
                ทีมงานยังไม่ได้ตอบกลับ กรุณารอสักครู่
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
