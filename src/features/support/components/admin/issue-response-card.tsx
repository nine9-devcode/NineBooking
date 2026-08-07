// components/admin/contact-issues/issue-response-card.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquareText, Send, Pencil, CheckCircle2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"

interface IssueResponseCardProps {
  adminResponse: string | null
  respondedAt: string | null
  currentValue: string
  onResponseChange: (value: string) => void
  onSendResponse: () => void
  isSaving: boolean
}

export function IssueResponseCard({
  adminResponse,
  respondedAt,
  currentValue,
  onResponseChange,
  onSendResponse,
  isSaving,
}: IssueResponseCardProps) {
  const [isEditing, setIsEditing] = useState(!adminResponse)

  const hasExistingResponse = !!adminResponse

  const handleSend = () => {
    onSendResponse()
    // After saving, go back to view mode
    if (currentValue.trim()) {
      setIsEditing(false)
    }
  }

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-primary" />
          ตอบกลับลูกค้า
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* View mode - show existing response */}
        {hasExistingResponse && !isEditing && (
          <>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">ตอบกลับแล้ว</span>
              </div>
              <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {adminResponse}
              </p>
              {respondedAt && (
                <p className="text-xs text-muted-foreground mt-3">
                  ตอบเมื่อ:{" "}
                  {format(new Date(respondedAt), "d MMM yyyy HH:mm น.", { locale: th })}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-border text-foreground hover:bg-card hover:text-foreground"
            >
              <Pencil className="w-4 h-4 mr-2" />
              แก้ไขคำตอบ
            </Button>
          </>
        )}

        {/* Edit mode - textarea + send button */}
        {isEditing && (
          <>
            <textarea
              value={currentValue}
              onChange={(e) => onResponseChange(e.target.value)}
              placeholder="พิมพ์ข้อความตอบกลับลูกค้า..."
              rows={5}
              className="w-full bg-background/50 border border-border text-foreground rounded-lg p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              disabled={isSaving}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSend}
                disabled={isSaving || !currentValue.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {hasExistingResponse ? "อัปเดตคำตอบ" : "ส่งคำตอบ"}
                  </>
                )}
              </Button>
              {hasExistingResponse && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    onResponseChange(adminResponse || "")
                  }}
                  disabled={isSaving}
                  className="text-muted-foreground hover:text-foreground hover:bg-card"
                >
                  ยกเลิก
                </Button>
              )}
            </div>
          </>
        )}

        {/* No response hint */}
        {!hasExistingResponse && !isEditing && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">ยังไม่ได้ตอบกลับลูกค้า</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="mt-2 border-border text-foreground hover:bg-card hover:text-foreground"
            >
              <Pencil className="w-4 h-4 mr-2" />
              เขียนคำตอบ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
