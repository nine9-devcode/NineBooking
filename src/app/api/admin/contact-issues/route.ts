// app/api/admin/contact-issues/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from "@/lib/db"
import { IssueCategory, IssueStatus, Prisma } from "@prisma/client"
import { parseEnumParam, parsePagination } from "@/lib/api/query"

// GET: ดึงรายการแจ้งปัญหา + Stats
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""
    const { page, limit, skip } = parsePagination(searchParams)

    // Build where clause
    const where: Prisma.ContactIssueWhereInput = {}

    // Search: issue number, subject, user name/email
    if (search) {
      where.OR = [
        { issueNumber: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { memberTypeNote: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = parseEnumParam(IssueStatus, status)
    }

    // Filter by category
    if (category && category !== "all") {
      where.category = parseEnumParam(IssueCategory, category)
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo)
        endDate.setDate(endDate.getDate() + 1)
        where.createdAt.lt = endDate
      }
    }

    // Fetch issues
    const [issues, total] = await Promise.all([
      prisma.contactIssue.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nickname: true,
              email: true,
              image: true,
              memberType: true,
              phone: true,
              memberTypeNote: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactIssue.count({ where }),
    ])

    // Unread issue notification IDs for isNew flag
    const unreadIssueNotifs = await prisma.issueNotification.findMany({
      where: { isRead: false },
      select: { issueId: true },
    })
    const unreadIssueIds = new Set(unreadIssueNotifs.map((n) => n.issueId))

    // Fetch stats
    const [totalIssues, pending, inProgress, closed, newToday] = await Promise.all([
      prisma.contactIssue.count(),
      prisma.contactIssue.count({ where: { status: "PENDING" } }),
      prisma.contactIssue.count({ where: { status: "IN_PROGRESS" } }),
      prisma.contactIssue.count({ where: { status: "CLOSED" } }),
      prisma.contactIssue.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    return NextResponse.json({
      issues: issues.map((issue) => ({ ...issue, isNew: unreadIssueIds.has(issue.id) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalIssues,
        pending,
        inProgress,
        closed,
        newToday,
      },
    })
  } catch (error) {
    console.error("Error fetching contact issues:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
