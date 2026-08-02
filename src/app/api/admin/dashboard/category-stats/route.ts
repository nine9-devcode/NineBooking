// ไฟล์: app/api/admin/dashboard/category-stats/route.ts
// GET /api/admin/dashboard/category-stats

import { NextResponse } from 'next/server';
import { requireAdmin } from "@/lib/api/guards"
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    // ดึงหมวดหมู่ทั้งหมด
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        products: {
          where: { isActive: true },
          select: {
            id: true,
            viewCount: true,
          },
        },
      },
    });

    // ดึง Orders ทั้งหมดพร้อม OrderItems
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderItems: {
          select: {
            product: {
              select: {
                categoryId: true,
              },
            },
            pairedProduct: {
              select: {
                categoryId: true,
              },
            },
          },
        },
      },
    });

    // นับจำนวน Order ที่มีสินค้าในแต่ละ Category
    // (1 Order นับ 1 ครั้งต่อ Category แม้จะมีหลาย items ในหมวดเดียวกัน)
    const orderCountByCategory: Record<string, Set<string>> = {};

    orders.forEach((order) => {
      // เก็บ categoryIds ที่ปรากฏใน Order นี้ (ใช้ Set เพื่อไม่ให้ซ้ำ)
      const categoriesInOrder = new Set<string>();

      order.orderItems.forEach((item) => {
        // เพิ่ม category ของ main product
        if (item.product?.categoryId) {
          categoriesInOrder.add(item.product.categoryId);
        }
        // เพิ่ม category ของ paired product (ถ้ามี)
        if (item.pairedProduct?.categoryId) {
          categoriesInOrder.add(item.pairedProduct.categoryId);
        }
      });

      // นับ Order นี้ให้แต่ละ Category ที่ปรากฏ
      categoriesInOrder.forEach((categoryId) => {
        if (!orderCountByCategory[categoryId]) {
          orderCountByCategory[categoryId] = new Set();
        }
        orderCountByCategory[categoryId].add(order.id);
      });
    });

    // คำนวณยอดจอง (จำนวน Order) + ยอดเข้าชมของแต่ละหมวดหมู่
    const categoryData = categories.map((category) => {
      // จำนวน Order ที่มีสินค้าในหมวดนี้
      const orderCount = orderCountByCategory[category.id]?.size || 0;

      // ยอดเข้าชมรวมของสินค้าในหมวดนี้
      const viewCount = category.products.reduce(
        (sum, product) => sum + product.viewCount,
        0
      );

      return {
        categoryId: category.id,
        categoryName: category.name,
        orderCount,
        viewCount,
      };
    });

    // คำนวณ Total
    const totalOrders = orders.length; // จำนวน Order ทั้งหมด
    const totalViews = categoryData.reduce((sum, cat) => sum + cat.viewCount, 0);

    // เรียงลำดับตาม orderCount (มากไปน้อย) และเอาแค่ Top 5
    const sortedByOrders = [...categoryData]
      .filter((cat) => cat.orderCount > 0 || cat.viewCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)
      .map((cat) => ({
        ...cat,
        orderPercentage: totalOrders > 0 ? (cat.orderCount / totalOrders) * 100 : 0,
        viewPercentage: totalViews > 0 ? (cat.viewCount / totalViews) * 100 : 0,
      }));

    return NextResponse.json({
      topCategories: sortedByOrders,
      totalOrders,
      totalViews,
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category stats' },
      { status: 500 }
    );
  }
}
