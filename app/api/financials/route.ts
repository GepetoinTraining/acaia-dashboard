import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, FinancialsData, HostessPayoutSummary } from "@/lib/types"; // Changed HostessPayout to HostessPayoutSummary
import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";

/**
 * GET /api/financials
 * Fetches all unpaid commissions and payouts.
 * This is an ADMIN-only route.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  // This must be an admin/owner
  if (!session.staff?.isLoggedIn || session.staff.pin !== "1234") {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    // 1. Get Unpaid Staff Commissions
    const staffCommissions = await prisma.staffCommission.findMany({
      where: { isPaidOut: false },
      include: {
        staff: true,
        relatedSale: true,
        relatedClient: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Get Unpaid Partner Payouts
    const partnerPayouts = await prisma.partnerPayout.findMany({
      where: { isPaidOut: false },
      include: {
        partner: true,
        sale: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    
    // 3. Get Hostess Commission Summary
    // This is a summary, not a payout ledger, as we haven't built the
    // "close shift" logic yet. We assume all sales are "unpaid" for now.
    const hostCommissions = await prisma.sale.groupBy({
      by: ["hostId"],
      _sum: {
        commissionEarned: true,
      },
      // TODO: Add a filter for `hostessPayoutId: null` once we add that
    });
    
    const hosts = await prisma.host.findMany({
      where: { id: { in: hostCommissions.map(h => h.hostId) }}
    });
    
    // FIX 1: Renamed variable to `hostessPayoutData` to avoid conflict with `HostessPayout` type
    const hostessPayoutData: HostessPayoutSummary[] = hostCommissions.map(hc => { // Changed HostessPayout to HostessPayoutSummary
      const host = hosts.find(h => h.id === hc.hostId);
      return {
        hostId: hc.hostId,
        stageName: host?.stageName || 'Host Deletada',
        // Step 1: Keep this as a number/Decimal for now
        totalUnpaidCommissions: hc._sum.commissionEarned || 0,
      }
    })
    // Step 2: Filter using the number/Decimal
    .filter(h => Number(h.totalUnpaidCommissions) > 0) // <-- FIX IS HERE
    // Step 3: Now map the filtered results to convert to a string
    .map(h => ({
      ...h,
      totalUnpaidCommissions: h.totalUnpaidCommissions.toString(),
    }));


    const data: FinancialsData = {
      staffCommissions: staffCommissions as any,
      partnerPayouts: partnerPayouts as any,
      // staffPayouts: [], // Removed this line
      hostessPayouts: hostessPayoutData,
    };

    return NextResponse.json<ApiResponse<FinancialsData>>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/financials error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar dados financeiros" },
      { status: 500 }
    );
  }
}

