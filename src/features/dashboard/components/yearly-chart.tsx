// ไฟล์: components/admin/dashboard/yearly-chart.tsx

'use client';

import { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, ShoppingCart, Eye, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { chartTheme, chartTooltipStyle } from "@/config/chart-theme";

interface YearlyStats {
  year: number;
  months: string[];
  orders: number[];
  views: number[];
  totalOrders: number;
  totalViews: number;
  availableYears: number[];
}

export function YearlyChart() {
  const [data, setData] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'views'>('orders');

  useEffect(() => {
    const fetchYearlyStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/dashboard/yearly-stats?year=${selectedYear}`);
        if (response.ok) {
          const statsData = await response.json();
          setData(statsData);
          if (statsData.availableYears?.length) {
            setAvailableYears(statsData.availableYears);
          }
        }
      } catch (error) {
        console.error('Error fetching yearly stats:', error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    fetchYearlyStats();
  }, [selectedYear]);

  const handlePrevYear = () => {
    if (!loading) setSelectedYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    if (!loading) setSelectedYear((prev) => prev + 1);
  };

  if (initialLoading) {
    return (
      <div className="bg-background rounded-xl p-6 border border-border">
        <div className="h-4 bg-card rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="h-80 bg-card/50 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!data) return null;

  // แปลงข้อมูลให้เป็น format ที่ Recharts ต้องการ
  const chartData = data.months.map((month, index) => ({
    month,
    value: activeTab === 'orders' ? data.orders[index] : data.views[index],
  }));

  // Config ตาม Tab
  const tabConfig = {
    orders: {
      label: 'ยอดจอง',
      color: chartTheme.series[0],
      gradient: 'colorOrders',
      total: data.totalOrders,
      icon: ShoppingCart,
    },
    views: {
      label: 'ยอดเข้าชม',
      color: chartTheme.series[2],
      gradient: 'colorViews',
      total: data.totalViews,
      icon: Eye,
    },
  };

  const currentConfig = tabConfig[activeTab];

  return (
    <div className="bg-background rounded-xl p-6 border border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${activeTab === 'orders' ? 'bg-primary/10' : 'bg-info/10'}`}>
            <TrendingUp className={`w-5 h-5 ${activeTab === 'orders' ? 'text-primary' : 'text-info'}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">ภาพรวมรายปี</h2>
            <p className="text-sm text-muted-foreground">ปี {selectedYear}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Tab Switch */}
          <div className="flex bg-card rounded-lg p-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              ยอดจอง
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'views'
                  ? 'bg-info text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-4 h-4" />
              ยอดเข้าชม
            </button>
          </div>

          {/* Year Picker */}
          <div className="flex items-center gap-1 bg-card rounded-lg p-1">
            <button
              onClick={handlePrevYear}
              disabled={loading}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[3.5rem] text-center">
              {selectedYear}
            </span>
            <button
              onClick={handleNextYear}
              disabled={loading}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className={`rounded-lg p-4 mb-6 ${activeTab === 'orders' ? 'bg-primary/10' : 'bg-info/10'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm mb-1">{currentConfig.label}ทั้งปี {selectedYear}</p>
            <p className={`text-3xl font-bold ${activeTab === 'orders' ? 'text-primary' : 'text-info'}`}>
              {currentConfig.total.toLocaleString()}
            </p>
          </div>
          <currentConfig.icon className={`w-12 h-12 ${activeTab === 'orders' ? 'text-primary/30' : 'text-info/30'}`} />
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartTheme.series[0]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartTheme.series[0]} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartTheme.series[2]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartTheme.series[2]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke={chartTheme.axisLine}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.axisLine }}
          />
          <YAxis 
            stroke={chartTheme.axisLine}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            axisLine={{ stroke: chartTheme.axisLine }}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: chartTheme.tooltipText, fontWeight: 'bold', marginBottom: '4px' }}
            formatter={(value: any) => [
              `${value.toLocaleString()} ${activeTab === 'orders' ? 'ครั้ง' : 'ครั้ง'}`,
              currentConfig.label
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={currentConfig.color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${currentConfig.gradient})`}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
