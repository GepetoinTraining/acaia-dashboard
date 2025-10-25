// File: app/api/financials/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
// Removed HostessPayoutSummary as it's not used and Hostess feature removed
import { ApiResponse, FinancialsData } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";

/**
 * GET /api/financials (Simplified for Acaia MVP)
 * Fetches only unpaid staff commissions.
 * ADMIN-only route.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  // Rely solely on Admin role for access
  if (!session.staff?.isLoggedIn || session.staff.role !== StaffRole.Admin) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado (Admin required)" },
      { status: 403 } // Forbidden is more appropriate than Unauthorized
    );
  }

  try {
    // 1. Get Unpaid Staff Commissions
    const staffCommissions = await prisma.staffCommission.findMany({
      where: { isPaidOut: false },
      include: {
        staff: { select: { name: true } }, // Select only needed staff fields
        relatedSale: true, // Keep for context if needed
        relatedClient: { select: { name: true } }, // Keep for context if needed
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Partner Payouts REMOVED
    // const partnerPayouts = await prisma.partnerPayout.findMany({ ... });

    // 3. Hostess Commission Summary REMOVED
    // const hostCommissions = await prisma.sale.groupBy({ ... });

    // Serialize Decimal fields in staffCommissions before sending
    const serializedStaffCommissions = staffCommissions.map(commission => ({
        ...commission,
        amountEarned: Number(commission.amountEarned), // Convert Decimal to number
        // Serialize nested Decimals if relatedSale is included and has them
        relatedSale: commission.relatedSale ? {
            ...commission.relatedSale,
            priceAtSale: Number(commission.relatedSale.priceAtSale),
            totalAmount: Number(commission.relatedSale.totalAmount),
        } : null,
    }));


    // Assemble simplified FinancialsData
    const data: FinancialsData = {
      staffCommissions: serializedStaffCommissions as any, // Cast needed after serialization
      // partnerPayouts: [], // Removed
      // hostessPayouts: [], // Removed
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