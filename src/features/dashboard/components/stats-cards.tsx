// ไฟล์: components/admin/dashboard/stats-cards.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  Clock,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
} from 'lucide-react';

interface Stats {
  totalMembers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalViews: number;
  todayViews: number;
  openIssues: number;
  orderTrend: number;
  viewTrend: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="h-4 bg-card rounded w-24 mb-3 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-background rounded-xl p-5 animate-pulse border border-border">
                  <div className="h-4 bg-card rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-card rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cardGroups = [
    {
      label: 'ภาพรวม',
      cards: [
        {
          title: 'สมาชิกทั้งหมด',
          value: stats.totalMembers,
          icon: Users,
          color: 'text-info',
          bgIcon: 'bg-info/10',
        },
        {
          title: 'สินค้าทั้งหมด',
          value: stats.totalProducts,
          icon: Package,
          color: 'text-success',
          bgIcon: 'bg-success/10',
        },
        {
          title: 'หมวดหมู่',
          value: stats.totalCategories,
          icon: FolderTree,
          color: 'text-chart-4',
          bgIcon: 'bg-chart-4/10',
        },
      ],
    },
    {
      label: 'คำสั่งจอง',
      cards: [
        {
          title: 'คำสั่งจองทั้งหมด',
          value: stats.totalOrders,
          icon: ShoppingCart,
          color: 'text-primary',
          bgIcon: 'bg-primary/10',
        },
        {
          title: 'รอดำเนินการ',
          value: stats.pendingOrders,
          icon: Clock,
          color: 'text-warning',
          bgIcon: 'bg-warning/10',
          highlight: stats.pendingOrders > 0,
        },
        {
          title: 'จองวันนี้',
          value: stats.todayOrders,
          icon: ShoppingCart,
          color: 'text-chart-4',
          bgIcon: 'bg-chart-4/10',
          trend: stats.orderTrend,
        },
      ],
    },
    {
      label: 'การเข้าชม & แจ้งปัญหา',
      cards: [
        {
          title: 'ยอดเข้าชมทั้งหมด',
          value: stats.totalViews,
          icon: Eye,
          color: 'text-info',
          bgIcon: 'bg-info/10',
        },
        {
          title: 'เข้าชมวันนี้',
          value: stats.todayViews,
          icon: Eye,
          color: 'text-success',
          bgIcon: 'bg-success/10',
          trend: stats.viewTrend,
        },
        {
          title: 'ปัญหารอดำเนินการ',
          value: stats.openIssues,
          icon: MessageSquare,
          color: 'text-destructive',
          bgIcon: 'bg-destructive/10',
          highlight: stats.openIssues > 0,
        },
      ],
    },
  ];

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {cardGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{group.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {group.cards.map((card, cardIndex) => (
              <div
                key={cardIndex}
                className={`
                  relative bg-background rounded-xl p-5
                  border border-border hover:border-border
                  transition-all duration-300 group
                  ${card.highlight ? 'ring-2 ring-warning/30' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-muted-foreground text-sm font-medium">{card.title}</h3>
                  <div className={`${card.bgIcon} p-2 rounded-lg transition-transform group-hover:scale-110`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>

                <p className={`text-2xl lg:text-3xl font-bold ${card.color}`}>
                  {card.value.toLocaleString()}
                </p>

                {card.trend !== undefined && (
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon value={card.trend} />
                    <span className={`text-xs font-medium ${
                      card.trend > 0 ? 'text-success' :
                      card.trend < 0 ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {card.trend > 0 ? '+' : ''}{card.trend}% จากเมื่อวาน
                    </span>
                  </div>
                )}

                {card.highlight && (
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
