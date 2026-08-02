// app/admin/(dashboard)/report/page.tsx

'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Loader2,
  Users,
  ShoppingCart,
  Eye,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { th } from 'date-fns/locale';

// Format as Thai Buddhist Era (พ.ศ.)
function formatThaiBEDate(isoString: string): string {
  const date = new Date(isoString);
  return `${format(date, 'd MMMM', { locale: th })} ${date.getFullYear() + 543}`;
}

function formatThaiBEDateTime(isoString: string): string {
  const date = new Date(isoString);
  return `${format(date, 'd MMMM', { locale: th })} ${date.getFullYear() + 543}, ${format(date, 'HH:mm')} น.`;
}
import type { ReportData } from '@/features/dashboard/summary-report.types';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  DateRangeControls,
  OverviewTab,
  OrdersTab,
  MembersTab,
  ProductsTab,
  IssuesTab,
} from '@/features/dashboard/components/report';

type TabKey = 'overview' | 'orders' | 'members' | 'products' | 'issues';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'ภาพรวม', icon: FileText },
  { key: 'orders', label: 'คำสั่งจอง', icon: ShoppingCart },
  { key: 'members', label: 'สมาชิก', icon: Users },
  { key: 'products', label: 'สินค้า', icon: Eye },
  { key: 'issues', label: 'ปัญหา/แจ้งเรื่อง', icon: MessageSquare },
];

// Wrapper ครอบ Suspense สำหรับ useSearchParams
export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <span className="text-muted-foreground">กำลังโหลด...</span>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Date range - check URL params first, then default to 30 days
  const [startDate, setStartDate] = useState<Date>(() => {
    const paramStart = searchParams.get('start');
    if (paramStart) {
      const d = new Date(paramStart);
      if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); return d; }
    }
    const d = new Date();
    d.setDate(d.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const paramEnd = searchParams.get('end');
    if (paramEnd) {
      const d = new Date(paramEnd);
      if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); return d; }
    }
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/admin/dashboard/summary-report?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report data');
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('เกิดข้อผิดพลาด', {
        description: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลได้',
      });
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Sync URL when dates change
  useEffect(() => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');
    const currentStart = searchParams.get('start');
    const currentEnd = searchParams.get('end');
    if (currentStart !== startStr || currentEnd !== endStr) {
      router.replace(`/admin/report?start=${startStr}&end=${endStr}`, { scroll: false });
    }
  }, [startDate, endDate, router, searchParams]);

  const handleQuickRange = (days: number) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (days === 0) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      setStartDate(start);
      setEndDate(end);
    } else {
      const start = addDays(end, -days);
      start.setHours(0, 0, 0, 0);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleReset = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    setIsDownloadingPDF(true);
    toast.info('กำลังสร้าง PDF...', { description: 'กรุณารอสักครู่' });

    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const response = await fetch(`/api/admin/dashboard/summary-report/pdf?${params}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}`;
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-report-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('ดาวน์โหลด PDF สำเร็จ!');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF', {
        description: error instanceof Error ? error.message : 'ไม่สามารถดาวน์โหลดได้',
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportData) return;
    setIsDownloadingExcel(true);
    toast.info('กำลังสร้าง Excel...', { description: 'กรุณารอสักครู่' });

    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const response = await fetch(`/api/admin/dashboard/summary-report/excel?${params}`);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}`;
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary-report-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('ดาวน์โหลด Excel สำเร็จ!');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการสร้าง Excel', {
        description: error instanceof Error ? error.message : 'ไม่สามารถดาวน์โหลดได้',
      });
    } finally {
      setIsDownloadingExcel(false);
    }
  };


  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">สรุปรายงาน</h1>
          <p className="text-muted-foreground text-sm">รายงานสถิติและข้อมูลสำคัญของระบบ</p>
        </div>
      </div>

      {/* Date Range Controls */}
      <DateRangeControls
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoading}
        hasData={!!reportData}
        isDownloadingPDF={isDownloadingPDF}
        isDownloadingExcel={isDownloadingExcel}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onQuickRange={handleQuickRange}
        onReset={handleReset}
        onDownloadPDF={handleDownloadPDF}
        onDownloadExcel={handleDownloadExcel}
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-background border border-border rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                ${activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <span className="text-muted-foreground">กำลังโหลดข้อมูลรายงาน...</span>
        </div>
      ) : !reportData ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <p className="text-muted-foreground text-lg">ไม่สามารถโหลดข้อมูลรายงานได้</p>
          <Button onClick={fetchReportData} variant="outline" className="mt-4 border-border text-foreground hover:bg-card hover:text-foreground">
            ลองใหม่
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report metadata */}
          <div className="text-center space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-muted-foreground">ช่วงเวลา:</span>{' '}
              <span className="text-foreground">
                {formatThaiBEDate(reportData.dateRange.start)} - {formatThaiBEDate(reportData.dateRange.end)}
              </span>
            </p>
            <p>
              <span className="font-medium text-muted-foreground">ข้อมูล ณ วันที่:</span>{' '}
              <span className="text-foreground">{formatThaiBEDateTime(reportData.generatedAt)}</span>
            </p>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewTab reportData={reportData} />}
          {activeTab === 'orders' && <OrdersTab reportData={reportData} />}
          {activeTab === 'members' && <MembersTab reportData={reportData} />}
          {activeTab === 'products' && <ProductsTab reportData={reportData} />}
          {activeTab === 'issues' && <IssuesTab reportData={reportData} />}

          {/* Footer Note */}
          <div className="bg-background border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">หมายเหตุ</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>ข้อมูลในรายงานนี้เป็นข้อมูล ณ เวลาที่สร้างรายงาน และอาจมีการเปลี่ยนแปลงแบบเรียลไทม์</li>
                  <li>เปอร์เซ็นต์แนวโน้มคำนวณจากการเปรียบเทียบกับช่วงเวลาก่อนหน้า</li>
                  <li>สถิติหมวดหมู่และสินค้ายอดนิยมแสดงเฉพาะ Top 5 เท่านั้น</li>
                  <li>ยอดเข้าชมนับรวมทั้งสมาชิกและผู้เยี่ยมชมทั่วไป</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
