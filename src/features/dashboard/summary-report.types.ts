// types/summary-report.types.ts

export interface DateRange {
  start: string
  end: string
  compareStart: string
  compareEnd: string
  comparisonLabel: string
}

export interface CategoryStat {
  categoryId: string
  categoryName: string
  orderCount: number
  viewCount: number
  orderPercentage: number
  viewPercentage: number
}

export interface TopProduct {
  name: string
  orderCount?: number
  viewCount?: number
}

export interface MonthlyStats {
  month: string
  orders: number
  views: number
}

export interface ContactIssueStats {
  totalIssues: number
  issuesInPeriod: number
  pendingIssues: number
  inProgressIssues: number
  closedIssuesInPeriod: number
  issuesByCategory: Array<{
    category: string
    count: number
  }>
}

export interface MemberGrowthStats {
  newMembersInPeriod: number
  newMembersComparePeriod: number
  memberGrowthTrend: number
  membersByType: Array<{
    memberType: string
    count: number
  }>
}

export interface ReportData {
  // Date Range
  dateRange: DateRange

  // สถิติภาพรวม
  totalMembers: number
  totalProducts: number
  totalCategories: number
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  completedOrders: number
  cancelledOrders: number
  currentPeriodOrders: number
  comparePeriodOrders: number
  totalViews: number
  currentPeriodViews: number
  comparePeriodViews: number
  orderTrend: number
  viewTrend: number

  // สถิติตามหมวดหมู่
  categoryStats: CategoryStat[]

  // สินค้ายอดนิยม
  topProductsByOrders: TopProduct[]
  topProductsByViews: TopProduct[]

  // สถิติรายเดือน
  monthlyStats: MonthlyStats[]

  // Contact Issues
  contactIssueStats: ContactIssueStats

  // Member Growth
  memberGrowthStats: MemberGrowthStats

  // Metadata
  generatedAt: string
}

export interface SummaryReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
