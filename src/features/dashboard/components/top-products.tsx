// ไฟล์: components/admin/dashboard/top-products.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Eye, Package, TrendingUp, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';

interface TopProductByOrder {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  categoryName: string;
  orderCount: number;    // จำนวน Order ที่มีสินค้านี้
  totalQuantity: number; // จำนวนชิ้นรวม (ไม่รวม paired)
}

interface TopProductByView {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  categoryName: string;
  viewCount: number;
}

interface TopProductsData {
  topByOrders: TopProductByOrder[];
  topByViews: TopProductByView[];
}

const MEDAL_COLORS = ['text-warning', 'text-foreground', 'text-warning'];
const MEDAL_BG = ['bg-warning/10', 'bg-secondary/20', 'bg-warning/10'];

export function TopProducts() {
  const [data, setData] = useState<TopProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'orders' | 'views'>('orders');

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch('/api/admin/dashboard/top-products');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="bg-background rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 bg-card rounded w-1/3"></div>
          <div className="h-8 bg-card rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-card/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background rounded-xl p-6 border border-border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-destructive/60 mb-3" />
          <p className="text-foreground font-medium">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-muted-foreground text-sm mt-1">กรุณาลองใหม่อีกครั้ง</p>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-card hover:bg-secondary text-foreground text-sm rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'orders' ? data?.topByOrders : data?.topByViews;
  const isEmpty = !currentList || currentList.length === 0;

  const maxOrders = data?.topByOrders?.[0]?.orderCount ?? 1;
  const maxViews = data?.topByViews?.[0]?.viewCount ?? 1;

  return (
    <div className="bg-background rounded-xl p-6 border border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${activeTab === 'orders' ? 'bg-primary/10' : 'bg-info/10'}`}>
            {activeTab === 'orders' ? (
              <Trophy className="w-5 h-5 text-primary" />
            ) : (
              <Eye className="w-5 h-5 text-info" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {activeTab === 'orders' ? 'สินค้ายอดนิยม' : 'สินค้าที่มีคนสนใจ'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'orders' ? 'Top 5 ถูกจองบ่อยที่สุด' : 'Top 5 ยอดเข้าชมสูงสุด'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
            title="รีโหลดข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* View All Link */}
          <Link
            href="/admin/products"
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
          >
            ดูทั้งหมด
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Tab Switch */}
          <div className="flex bg-card rounded-lg p-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Trophy className="w-4 h-4" />
              ยอดจอง
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'views'
                  ? 'bg-info text-primary-foreground shadow-lg'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-4 h-4" />
              ยอดเข้าชม
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="w-12 h-12 text-foreground mb-3" />
          <p className="text-muted-foreground">
            {activeTab === 'orders' ? 'ยังไม่มีข้อมูลยอดจอง' : 'ยังไม่มีข้อมูลยอดเข้าชม'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'orders'
            ? data?.topByOrders.map((product, index) => (
                <ProductOrderItem
                  key={product.id}
                  product={product}
                  index={index}
                  max={maxOrders}
                />
              ))
            : data?.topByViews.map((product, index) => (
                <ProductViewItem
                  key={product.id}
                  product={product}
                  index={index}
                  max={maxViews}
                />
              ))}
        </div>
      )}
    </div>
  );
}

// Component สำหรับแสดงสินค้า (ยอดจอง)
function ProductOrderItem({ product, index, max }: { product: TopProductByOrder; index: number; max: number }) {
  const isTop3 = index < 3;
  const barWidth = max > 0 ? Math.round((product.orderCount / max) * 100) : 0;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border">
      {/* Rank */}
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${isTop3 ? MEDAL_BG[index] : 'bg-secondary'}`}>
        <span className={`text-sm font-bold ${isTop3 ? MEDAL_COLORS[index] : 'text-muted-foreground'}`}>
          {index + 1}
        </span>
      </div>

      {/* Image */}
      <div className="flex-shrink-0 w-14 h-14 bg-secondary rounded-lg overflow-hidden">
        {product.image ? (
          <Image src={product.image} alt={product.name} width={56} height={56} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info + Progress Bar */}
      <div className="flex-1 min-w-0">
        <h3 className="text-foreground font-medium truncate">{product.name}</h3>
        <p className="text-muted-foreground text-sm truncate">{product.categoryName}</p>
        {/* Progress Bar */}
        <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-lg text-primary">
          {product.orderCount.toLocaleString()} <span className="text-sm font-normal">ใบจอง</span>
        </p>
        <p className="text-muted-foreground text-sm">
          {product.totalQuantity.toLocaleString()} ชิ้น
        </p>
      </div>
    </div>
  );
}

// Component สำหรับแสดงสินค้า (ยอดเข้าชม)
function ProductViewItem({ product, index, max }: { product: TopProductByView; index: number; max: number }) {
  const isTop3 = index < 3;
  const barWidth = max > 0 ? Math.round((product.viewCount / max) * 100) : 0;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border">
      {/* Rank */}
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${isTop3 ? MEDAL_BG[index] : 'bg-secondary'}`}>
        <span className={`text-sm font-bold ${isTop3 ? MEDAL_COLORS[index] : 'text-muted-foreground'}`}>
          {index + 1}
        </span>
      </div>

      {/* Image */}
      <div className="flex-shrink-0 w-14 h-14 bg-secondary rounded-lg overflow-hidden">
        {product.image ? (
          <Image src={product.image} alt={product.name} width={56} height={56} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info + Progress Bar */}
      <div className="flex-1 min-w-0">
        <h3 className="text-foreground font-medium truncate">{product.name}</h3>
        <p className="text-muted-foreground text-sm truncate">{product.categoryName}</p>
        {/* Progress Bar */}
        <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-info/70 rounded-full transition-all duration-500"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-lg text-info">
          {product.viewCount.toLocaleString()} <span className="text-sm font-normal">ครั้ง</span>
        </p>
      </div>
    </div>
  );
}
