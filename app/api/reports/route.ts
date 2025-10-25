import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, ReportData } from "@/lib/types"; // FIX: Import only ReportData
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";
import { Prisma } from "@prisma/client";

/**
 * GET /api/reports
 * Fetches all aggregated data for the BI dashboard.
 * ADMIN-only route.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn || session.staff.pin !== "1234") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();

    // --- 1. KPIs ---
    const totalSalesData = await prisma.sale.aggregate({
      _sum: { priceAtSale: true },
      _count: { id: true },
    });
    const newClients = await prisma.client.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const totalRevenue = Number(totalSalesData._sum.priceAtSale || 0);
    const totalSales = totalSalesData._count.id;
    const avgSaleValue = totalRevenue / (totalSales || 1);

    // FIX: Match the kpis object structure from lib/types.ts
    const kpis: ReportData["kpis"] = {
      totalRevenue: totalRevenue,
      totalSales: totalSales,
      avgSaleValue: avgSaleValue,
      newClients: newClients,
    };

    // --- 2. Sales by Day (Chart) ---
    const salesByDayRaw = await prisma.sale.groupBy({
      by: ["createdAt"],
      _sum: {
        priceAtSale: true,
      },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Aggregate by day (since raw data is by timestamp)
    const salesMap = new Map<string, number>();
    salesByDayRaw.forEach((sale) => {
      const date = dayjs(sale.createdAt).format("DD/MM/YYYY");
      const currentSales = salesMap.get(date) || 0;
      // FIX: Convert Decimal to Number before adding
      const newSales = currentSales + Number(sale._sum.priceAtSale || 0);
      salesMap.set(date, newSales);
    });

    // FIX: Match salesOverTime type ({ date, Revenue })
    const salesOverTime: ReportData["salesOverTime"] = Array.from(
      salesMap.entries()
    ).map(([date, sales]) => ({
      date: date,
      Revenue: parseFloat(sales.toFixed(2)), // FIX: Use 'Revenue' (capital R)
    }));

    // --- 3. Top Hostesses ---
    const topHostessesRaw = await prisma.sale.groupBy({
      by: ["hostId"],
      _sum: {
        priceAtSale: true, // This is what 'Sales' will be
      },
      orderBy: {
        _sum: {
          priceAtSale: "desc",
        },
      },
      take: 5,
    });

    const hosts = await prisma.host.findMany({
      where: { id: { in: topHostessesRaw.map((h) => h.hostId) } },
    });

    // FIX: Match hostessLeaderboard type ({ name, Sales })
    const hostessLeaderboard: ReportData["hostessLeaderboard"] =
      topHostessesRaw.map((h) => {
        const host = hosts.find((host) => host.id === h.hostId);
        return {
          name: host?.stageName || "Host Deletada",
          Sales: Number(h._sum.priceAtSale || 0), // FIX: Use 'Sales' (capital S)
        };
      });

    // --- 4. Top Products ---
    const topProductsRaw = await prisma.sale.groupBy({
      by: ["productId"],
      _sum: {
        priceAtSale: true, // This is what 'Sales' will be
      },
      orderBy: {
        _sum: {
          priceAtSale: "desc",
        },
      },
      take: 5,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: topProductsRaw.map((p) => p.productId) } },
    });

    // FIX: Match productLeaderboard type ({ name, Sales })
    const productLeaderboard: ReportData["productLeaderboard"] =
      topProductsRaw.map((p) => {
        const product = products.find((prod) => prod.id === p.productId);
        return {
          name: product?.name || "Produto Deletado",
          Sales: Number(p._sum.priceAtSale || 0), // FIX: Use 'Sales' (capital S)
        };
      });

    // --- Assemble Report Data ---
    // FIX: Match the ReportData structure (e.g., 'salesOverTime')
    const data: ReportData = {
      kpis: kpis,
      salesOverTime: salesOverTime,
      hostessLeaderboard: hostessLeaderboard,
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

