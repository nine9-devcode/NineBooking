// ไฟล์: components/admin/dashboard/recent-orders-table.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderStatus } from "@prisma/client";
import { OrderStatusBadge } from "@/components/ui/status-badge";

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalItems: number;
  customer: {
    name: string | null;
    nickname: string | null;
    email: string;
    image: string | null;
  };
}


export function RecentOrdersTable() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/recent-orders?limit=5');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
  }, []);

  if (loading) {
    return (
      <div className="bg-background rounded-xl p-6 border border-border">
        <div className="h-4 bg-card rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">คำสั่งจองล่าสุด</h2>
            <p className="text-sm text-muted-foreground">5 รายการล่าสุด</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-card hover:text-foreground">
          <Link href="/admin/orders">
            ดูทั้งหมด
            <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag className="w-12 h-12 text-foreground mb-3" />
          <p className="text-muted-foreground">ยังไม่มีคำสั่งจอง</p>
          <p className="text-muted-foreground text-sm mt-1">คำสั่งจองจะแสดงที่นี่เมื่อมีลูกค้าทำการจอง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {

            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-4 p-3 rounded-lg bg-card/50 hover:bg-card transition-all border border-transparent hover:border-border group"
              >
                {/* Customer Avatar */}
                <div className="flex-shrink-0">
                  {order.customer.image ? (
                    <Image
                      src={order.customer.image}
                      alt={order.customer.name || 'Customer'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
                      <span className="text-foreground font-semibold text-sm">
                        {order.customer.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-medium text-sm">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status as OrderStatus} showIcon={false} />
                  </div>
                  <p className="text-muted-foreground text-sm truncate">
                    {order.customer.nickname || order.customer.name || order.customer.email}
                  </p>
                </div>

                {/* Items & Date */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-foreground text-sm font-medium">
                    {order.totalItems} ชิ้น
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(order.createdAt), 'dd MMM yy', { locale: th })}
                  </p>
                </div>

                {/* Arrow */}
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
