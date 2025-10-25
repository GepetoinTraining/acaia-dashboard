// File: app/api/reports/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
// --- FIX: Import ReportData, ProductLeaderboardItem ---
import { ApiResponse, ReportData, ProductLeaderboardItem } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";
// --- FIX: Import StaffRole for check, Product for lookup ---
import { Prisma, StaffRole, Product } from "@prisma/client";

/**
 * GET /api/reports (Simplified for Acaia MVP)
 * Fetches aggregated data for the BI dashboard (excluding Hostess data).
 * ADMIN-only route.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  // --- FIX: Use StaffRole for check ---
  if (!session.staff?.isLoggedIn || session.staff.role !== StaffRole.Admin) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado (Admin required)" },
      { status: 403 } // Use Forbidden
    );
  }

  try {
    const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();

    // --- 1. KPIs ---
    const totalSalesData = await prisma.sale.aggregate({
      _sum: { totalAmount: true }, // Use totalAmount from Sale model
      _count: { id: true },
      where: {
        createdAt: { gte: thirtyDaysAgo }, // Aggregate based on the date range
      },
    });
    const newClients = await prisma.client.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const totalRevenue = Number(totalSalesData._sum.totalAmount || 0); // Use totalAmount
    const totalSales = totalSalesData._count.id;
    const avgSaleValue = totalRevenue / (totalSales || 1);

    const kpis: ReportData["kpis"] = {
      totalRevenue: totalRevenue,
      totalSales: totalSales,
      avgSaleValue: avgSaleValue,
      newClients: newClients,
    };

    // --- 2. Sales by Day (Chart) ---
    const salesByDayRaw = await prisma.sale.groupBy({
      // Group by the date part of createdAt
      by: [Prisma.sql`DATE("createdAt")`], // Use SQL function for date grouping
      _sum: {
        totalAmount: true, // Sum totalAmount
      },
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: {
        // Order by the same date grouping
         _sum: { createdAt: "asc" }, // Order by the date itself
      },
    });

    // Format for chart
    const salesOverTime: ReportData["salesOverTime"] = salesByDayRaw.map((saleGroup: any) => {
        // The date comes back differently depending on DB when using SQL functions
        const dateKey = saleGroup['date'] || saleGroup['DATE("createdAt")']; // Adjust based on actual key
        const date = dayjs(dateKey).format("DD/MM/YYYY");
        const revenue = Number(saleGroup._sum.totalAmount || 0);
        return {
            date: date,
            Revenue: parseFloat(revenue.toFixed(2)), // Ensure 2 decimal places
        };
    }).sort((a, b) => dayjs(a.date, "DD/MM/YYYY").unix() - dayjs(b.date, "DD/MM/YYYY").unix()); // Ensure sorted by date string

    // --- 3. Top Hostesses (REMOVED BLOCK) ---
    /*
    const topHostessesRaw = await prisma.sale.groupBy({
      by: ["hostId"], // THIS FIELD DOES NOT EXIST
      _sum: {
        priceAtSale: true,
      },
      orderBy: {
        _sum: {
          priceAtSale: "desc",
        },
      },
      take: 5,
    });
    // Fetching Host models is also removed
    const hosts = await prisma.host.findMany({ ... });
    const hostessLeaderboard: ReportData["hostessLeaderboard"] = ... ;
    */
    // --- END REMOVED BLOCK ---


    // --- 4. Top Products (by Quantity Sold) ---
    const topProductsRaw = await prisma.sale.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true, // Sum the quantity sold
      },
      where: {
         createdAt: { gte: thirtyDaysAgo }, // Filter by date range
      },
      orderBy: {
        _sum: {
          quantity: "desc", // Order by most units sold
        },
      },
      take: 5,
    });

    // --- FIX: Handle potential null productId ---
    const productIds = topProductsRaw
        .map((p) => p.productId)
        .filter((id): id is number => id !== null); // Filter out nulls and type guard

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } }, // Use filtered IDs
        select: { id: true, name: true } // Select only needed fields
    });

    // --- FIX: Match ProductLeaderboardItem type ---
    const productLeaderboard: ReportData["productLeaderboard"] =
      topProductsRaw.map((p) => {
        const product = products.find((prod) => prod.id === p.productId);
        return {
          productId: p.productId, // Include ID
          name: product?.name || "Produto Deletado",
          totalQuantitySold: Number(p._sum.quantity || 0), // Use quantity sum
        };
      // Filter out entries where product might be null if needed
      }).filter(p => p.productId !== null) as ProductLeaderboardItem[];


    // --- Assemble Report Data (Excluding Hostess) ---
    // --- FIX: Use correct field names and exclude hostessLeaderboard ---
    const data: ReportData = {
      kpis: kpis,
      salesOverTime: salesOverTime,
      // hostessLeaderboard: [], // Removed entirely
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