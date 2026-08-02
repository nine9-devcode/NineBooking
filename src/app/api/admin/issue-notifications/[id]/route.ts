// app/api/admin/issue-notifications/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from "@/lib/api/guards"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    
    console.log('Marking issue notification as read:', id)

    const notification = await prisma.issueNotification.update({
      where: {
        id: id
      },
      data: {
        isRead: true
      }
    })
    
    console.log('Successfully marked as read')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to mark issue notification as read:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}