// lib/report-data.ts
// Shared data layer for summary report - used by JSON, PDF, and Excel routes

import { prisma } from '@/lib/db';
import type { ReportData, CategoryStat, ContactIssueStats, MemberGrowthStats, MonthlyStats } from '@/features/dashboard/summary-report.types';

export interface SummaryReportParams {
  currentStart: Date;
  currentEnd: Date;
  compareStart: Date;
  compareEnd: Date;
  comparisonLabel: string;
}

/**
 * Parse and validate date range from query params.
 * Returns the params needed for calculateSummaryReport.
 */
export function parseDateParams(
  startDateParam: string | null,
  endDateParam: string | null,
  compareMode: string = 'previous_day'
): SummaryReportParams {
  let currentStart: Date;
  let currentEnd: Date;

  if (startDateParam && endDateParam) {
    const startTimestamp = Date.parse(startDateParam);
    const endTimestamp = Date.parse(endDateParam);

    if (isNaN(startTimestamp) || isNaN(endTimestamp)) {
      throw new Error('Invalid date format');
    }

    currentStart = new Date(startDateParam);
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(endDateParam);
    currentEnd.setHours(23, 59, 59, 999);

    const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1825 || daysDiff < 0) {
      throw new Error('Invalid date range (max 1825 days)');
    }
  } else {
    currentStart = new Date();
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date();
    currentEnd.setHours(23, 59, 59, 999);
  }

  const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

  let compareStart: Date;
  let compareEnd: Date;
  let comparisonLabel: string;

  switch (compareMode) {
    case 'previous_week':
      compareStart = new Date(currentStart);
      compareStart.setDate(compareStart.getDate() - 7);
      compareEnd = new Date(currentEnd);
      compareEnd.setDate(compareEnd.getDate() - 7);
      comparisonLabel = 'เทียบกับสัปดาห์ก่อน';
      break;

    case 'previous_month':
      compareStart = new Date(currentStart);
      compareStart.setMonth(compareStart.getMonth() - 1);
      compareEnd = new Date(currentEnd);
      compareEnd.setMonth(compareEnd.getMonth() - 1);
      comparisonLabel = 'เทียบกับเดือนก่อน';
      break;

    case 'previous_day':
    default:
      compareStart = new Date(currentStart);
      compareStart.setDate(compareStart.getDate() - daysDiff);
      compareEnd = new Date(currentEnd);
      compareEnd.setDate(compareEnd.getDate() - daysDiff);
      comparisonLabel = daysDiff === 1 ? 'เทียบกับเมื่อวาน' : `เทียบกับช่วง ${daysDiff} วันก่อนหน้า`;
      break;
  }

  return { currentStart, currentEnd, compareStart, compareEnd, comparisonLabel };
}

/**
 * Calculate all summary report data. Used by JSON route, PDF route, and Excel route.
 */
export async function calculateSummaryReport(params: SummaryReportParams): Promise<ReportData> {
  const { currentStart, currentEnd, compareStart, compareEnd, comparisonLabel } = params;

  // =============================================
  // 1. Basic stats (parallel)
  // =============================================
  const [
    totalMembers,
    totalProducts,
    totalCategories,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    completedOrders,
    cancelledOrders,
    currentPeriodOrders,
    comparePeriodOrders,
    totalViewsResult,
    currentPeriodViews,
    comparePeriodViews,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: 'PENDING', createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.order.count({
      where: { status: 'CONFIRMED', createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.order.count({
      where: { status: 'COMPLETED', createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.order.count({
      where: { status: 'CANCELLED', createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: compareStart, lte: compareEnd } },
    }),
    prisma.product.aggregate({
      _sum: { viewCount: true },
      where: { isActive: true },
    }).then(res => res._sum.viewCount || 0),
    prisma.productView.count({
      where: { viewedAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.productView.count({
      where: { viewedAt: { gte: compareStart, lte: compareEnd } },
    }),
  ]);

  // Trends
  const orderTrend = comparePeriodOrders > 0
    ? Math.round(((currentPeriodOrders - comparePeriodOrders) / comparePeriodOrders) * 100)
    : currentPeriodOrders > 0 ? 100 : 0;

  const viewTrend = comparePeriodViews > 0
    ? Math.round(((currentPeriodViews - comparePeriodViews) / comparePeriodViews) * 100)
    : currentPeriodViews > 0 ? 100 : 0;

  // =============================================
  // 2. Category stats (with date filter)
  // =============================================
  const [categories, ordersForCategories] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        products: {
          where: { isActive: true },
          select: { id: true, viewCount: true },
        },
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
      select: {
        id: true,
        orderItems: {
          select: {
            product: { select: { categoryId: true } },
            pairedProduct: { select: { categoryId: true } },
          },
        },
      },
    }),
  ]);

  const orderCountByCategory: Record<string, Set<string>> = {};
  ordersForCategories.forEach((order) => {
    const categoriesInOrder = new Set<string>();
    order.orderItems.forEach((item) => {
      if (item.product?.categoryId) categoriesInOrder.add(item.product.categoryId);
      if (item.pairedProduct?.categoryId) categoriesInOrder.add(item.pairedProduct.categoryId);
    });
    categoriesInOrder.forEach((categoryId) => {
      if (!orderCountByCategory[categoryId]) orderCountByCategory[categoryId] = new Set();
      orderCountByCategory[categoryId].add(order.id);
    });
  });

  const categoryData = categories.map((category) => ({
    categoryId: category.id,
    categoryName: category.name,
    orderCount: orderCountByCategory[category.id]?.size || 0,
    viewCount: category.products.reduce((sum, p) => sum + p.viewCount, 0),
  }));

  const categoryTotalOrders = ordersForCategories.length;
  const categoryTotalViews = categoryData.reduce((sum, cat) => sum + cat.viewCount, 0);

  const categoryStats: CategoryStat[] = [...categoryData]
    .filter((cat) => cat.orderCount > 0 || cat.viewCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5)
    .map((cat) => ({
      ...cat,
      orderPercentage: categoryTotalOrders > 0
        ? parseFloat(((cat.orderCount / categoryTotalOrders) * 100).toFixed(1))
        : 0,
      viewPercentage: categoryTotalViews > 0
        ? parseFloat(((cat.viewCount / categoryTotalViews) * 100).toFixed(1))
        : 0,
    }));

  // =============================================
  // 3. Top Products (fix N+1 query)
  // =============================================
  const productOrderCounts = await prisma.orderItem.groupBy({
    by: ['productId'],
    _count: { productId: true },
    orderBy: { _count: { productId: 'desc' } },
    take: 5,
  });

  const topProductsByViews = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { viewCount: 'desc' },
    take: 5,
    select: { name: true, viewCount: true },
  });

  // Single findMany instead of N findUnique calls
  const topOrderProductIds = productOrderCounts.map(p => p.productId);
  const topOrderProducts = topOrderProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: topOrderProductIds } },
        select: { id: true, name: true },
      })
    : [];

  const productNameMap = new Map(topOrderProducts.map(p => [p.id, p.name]));
  const topProductsByOrders = productOrderCounts.map((item) => ({
    name: productNameMap.get(item.productId) || 'ไม่ทราบชื่อ',
    orderCount: item._count.productId,
  }));

  // =============================================
  // 4. Monthly Stats (optimized: 3 queries instead of 24)
  // =============================================
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [allOrdersForMonthly, viewSummaries, todayLiveViews] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.productViewSummary.groupBy({
      by: ['date'],
      where: { date: { gte: twelveMonthsAgo } },
      _sum: { viewCount: true },
    }),
    prisma.productView.count({
      where: { viewedAt: { gte: todayStart } },
    }),
  ]);

  // Bucket into 12 months
  const monthlyOrders = Array(12).fill(0);
  const monthlyViews = Array(12).fill(0);

  allOrdersForMonthly.forEach((order) => {
    const orderDate = order.createdAt;
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - 11 + i + 1, 0, 23, 59, 59, 999);
      if (orderDate >= monthStart && orderDate <= monthEnd) {
        monthlyOrders[i]++;
        break;
      }
    }
  });

  viewSummaries.forEach((record) => {
    const recordDate = new Date(record.date);
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - 11 + i + 1, 0, 23, 59, 59, 999);
      if (recordDate >= monthStart && recordDate <= monthEnd) {
        monthlyViews[i] += (record._sum.viewCount || 0);
        break;
      }
    }
  });

  // Add today's live views to current month
  monthlyViews[11] += todayLiveViews;

  const monthlyStats: MonthlyStats[] = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    monthlyStats.push({
      month: monthDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
      orders: monthlyOrders[i],
      views: monthlyViews[i],
    });
  }

  // =============================================
  // 5. Contact Issue Stats
  // =============================================
  const [
    totalIssues,
    issuesInPeriod,
    pendingIssues,
    inProgressIssues,
    closedIssuesInPeriod,
    issuesByCategory,
  ] = await Promise.all([
    prisma.contactIssue.count(),
    prisma.contactIssue.count({
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.contactIssue.count({ where: { status: 'PENDING' } }),
    prisma.contactIssue.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.contactIssue.count({
      where: { status: 'CLOSED', createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.contactIssue.groupBy({
      by: ['category'],
      where: { createdAt: { gte: currentStart, lte: currentEnd } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  const contactIssueStats: ContactIssueStats = {
    totalIssues,
    issuesInPeriod,
    pendingIssues,
    inProgressIssues,
    closedIssuesInPeriod,
    issuesByCategory: issuesByCategory.map((item) => ({
      category: item.category,
      count: item._count.id,
    })),
  };

  // =============================================
  // 6. Member Growth Stats
  // =============================================
  const [
    newMembersInPeriod,
    newMembersComparePeriod,
    membersByType,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: 'user', createdAt: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.user.count({
      where: { role: 'user', createdAt: { gte: compareStart, lte: compareEnd } },
    }),
    prisma.user.groupBy({
      by: ['memberType'],
      where: { role: 'user' },
      _count: { id: true },
    }),
  ]);

  const memberGrowthTrend = newMembersComparePeriod > 0
    ? Math.round(((newMembersInPeriod - newMembersComparePeriod) / newMembersComparePeriod) * 100)
    : newMembersInPeriod > 0 ? 100 : 0;

  const memberGrowthStats: MemberGrowthStats = {
    newMembersInPeriod,
    newMembersComparePeriod,
    memberGrowthTrend,
    membersByType: membersByType.map((item) => ({
      memberType: item.memberType || 'ไม่ระบุ',
      count: item._count.id,
    })),
  };

  // =============================================
  // Return complete report data
  // =============================================
  return {
    dateRange: {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      compareStart: compareStart.toISOString(),
      compareEnd: compareEnd.toISOString(),
      comparisonLabel,
    },
    totalMembers,
    totalProducts,
    totalCategories,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    completedOrders,
    cancelledOrders,
    currentPeriodOrders,
    comparePeriodOrders,
    totalViews: totalViewsResult,
    currentPeriodViews,
    comparePeriodViews,
    orderTrend,
    viewTrend,
    categoryStats,
    topProductsByOrders,
    topProductsByViews,
    monthlyStats,
    contactIssueStats,
    memberGrowthStats,
    generatedAt: new Date().toISOString(),
  };
}
