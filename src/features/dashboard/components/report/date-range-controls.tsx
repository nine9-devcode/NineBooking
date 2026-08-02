// components/admin/report/date-range-controls.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Calendar, RotateCcw, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

export interface QuickRange {
  label: string;
  days: number;
}

export const QUICK_RANGES: QuickRange[] = [
  { label: 'วันนี้', days: 0 },
  { label: '7 วัน', days: 7 },
  { label: '30 วัน', days: 30 },
  { label: '90 วัน', days: 90 },
  { label: '180 วัน', days: 180 },
  { label: '1 ปี', days: 365 },
];

interface DateRangeControlsProps {
  startDate: Date;
  endDate: Date;
  isLoading: boolean;
  hasData: boolean;
  isDownloadingPDF: boolean;
  isDownloadingExcel: boolean;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onQuickRange: (days: number) => void;
  onReset: () => void;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
}

export function DateRangeControls({
  startDate,
  endDate,
  isLoading,
  hasData,
  isDownloadingPDF,
  isDownloadingExcel,
  onStartDateChange,
  onEndDateChange,
  onQuickRange,
  onReset,
  onDownloadPDF,
  onDownloadExcel,
}: DateRangeControlsProps) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="font-medium">ช่วงเวลา</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_RANGES.map((range) => (
          <Button
            key={range.label}
            variant="outline"
            size="sm"
            onClick={() => onQuickRange(range.days)}
            className="border-border text-foreground hover:bg-card hover:text-foreground"
          >
            {range.label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-border text-muted-foreground hover:bg-card hover:text-foreground"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          ค่าเริ่มต้น (30 วัน)
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">จาก</label>
            <input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) { d.setHours(0, 0, 0, 0); onStartDateChange(d); }
              }}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">ถึง</label>
            <input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); onEndDateChange(d); }
              }}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF || isLoading || !hasData}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isDownloadingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isDownloadingPDF ? 'กำลังสร้าง...' : 'ส่งออก PDF'}
          </Button>

          <Button
            onClick={onDownloadExcel}
            disabled={isDownloadingExcel || isLoading || !hasData}
            size="sm"
            className="bg-success hover:bg-success text-success-foreground"
          >
            {isDownloadingExcel ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            {isDownloadingExcel ? 'กำลังสร้าง...' : 'ส่งออก Excel'}
          </Button>
        </div>
      </div>
    </div>
  );
}
