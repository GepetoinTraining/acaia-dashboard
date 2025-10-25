// File: app/api/reports/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, ReportData, ProductLeaderboardItem } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";
import { Prisma, StaffRole, Product } from "@prisma/client";

/**
 * GET /api/reports (Simplified for Acaia MVP)
 * Fetches aggregated data for the BI dashboard (excluding Hostess data).
 * ADMIN-only route.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn || session.staff.role !== StaffRole.Admin) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado (Admin required)" },
      { status: 403 }
    );
  }

  try {
    const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();

    // --- 1. KPIs ---
    const totalSalesData = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const newClients = await prisma.client.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const totalRevenue = Number(totalSalesData._sum.totalAmount || 0);
    const totalSales = totalSalesData._count.id;
    const avgSaleValue = totalRevenue / (totalSales || 1);

    const kpis: ReportData["kpis"] = {
      totalRevenue: totalRevenue,
      totalSales: totalSales,
      avgSaleValue: avgSaleValue,
      newClients: newClients,
    };

    // --- 2. Sales by Day (Chart) ---
    // --- FIX: Fetch raw sales data first ---
    const salesRaw = await prisma.sale.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            createdAt: true,
            totalAmount: true, // Select totalAmount
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    // --- FIX: Aggregate by day in application code ---
    const salesMap = new Map<string, number>();
    salesRaw.forEach((sale) => {
        const date = dayjs(sale.createdAt).format("DD/MM/YYYY");
        const currentSales = salesMap.get(date) || 0;
        // Convert Decimal totalAmount to Number before adding
        const saleAmount = Number(sale.totalAmount || 0);
        salesMap.set(date, currentSales + saleAmount);
    });

    // Format for chart
    const salesOverTime: ReportData["salesOverTime"] = Array.from(
        salesMap.entries()
    ).map(([date, sales]) => ({
        date: date,
        Revenue: parseFloat(sales.toFixed(2)), // Use 'Revenue', ensure 2 decimals
    })).sort((a, b) => dayjs(a.date, "DD/MM/YYYY").unix() - dayjs(b.date, "DD/MM/YYYY").unix()); // Ensure sorted


    // --- 3. Top Hostesses (REMOVED) ---


    // --- 4. Top Products (by Quantity Sold) ---
    const topProductsRaw = await prisma.sale.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true, // Sum the quantity sold
      },
      where: {
         createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const productIds = topProductsRaw
        .map((p) => p.productId)
        .filter((id): id is number => id !== null);

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
    });

    const productLeaderboard: ReportData["productLeaderboard"] =
      topProductsRaw.map((p) => {
        const product = products.find((prod) => prod.id === p.productId);
        return {
          productId: p.productId,
          name: product?.name || "Produto Deletado",
          totalQuantitySold: Number(p._sum.quantity || 0),
        };
      }).filter(p => p.productId !== null) as ProductLeaderboardItem[];


    // --- Assemble Report Data ---
    const data: ReportData = {
      kpis: kpis,
      salesOverTime: salesOverTime,
      productLeaderboard: productLeaderboard,
    };

    return NextResponse.json<ApiResponse<ReportData>>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar dados do relatório" },
      { status: 500 }
    );
  }
}