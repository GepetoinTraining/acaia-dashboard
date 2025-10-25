// File: app/api/financials/partners/route.ts
/* // --- COMMENT OUT START ---
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client"; // Added StaffRole for check

/**
 * PATCH /api/financials/partners
 * Marks a single partner payout as paid.
 * ADMIN-only route.
 *
 * THIS ROUTE IS DEPRECATED/DISABLED FOR ACAIA MVP
 * /
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  // Use StaffRole enum for check
  if (!session.staff?.isLoggedIn || session.staff.role !== StaffRole.Admin /* && session.staff.pin !== "1234" * /) { // Removed PIN check, rely on Admin role
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { payoutId } = body;

    if (!payoutId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "ID do pagamento é obrigatório" },
        { status: 400 }
      );
    }

    // THIS WILL CAUSE AN ERROR AS PartnerPayout MODEL DOES NOT EXIST
    // await prisma.partnerPayout.update({
    //   where: { id: payoutId },
    //   data: { isPaidOut: true },
    // });

     // Return a placeholder response since the operation is disabled
     return NextResponse.json<ApiResponse>(
       { success: false, error: "Funcionalidade de pagamento de parceiro desativada." },
       { status: 404 } // Not Found or 410 Gone might be appropriate
     );


    // return NextResponse.json<ApiResponse>(
    //   { success: true },
    //   { status: 200 }
    // );
  } catch (error: any) {
    console.error("PATCH /api/financials/partners error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao marcar pagamento como pago (Rota desativada)" },
      { status: 500 }
    );
  }
}
*/ // --- COMMENT OUT END ---

// Add a placeholder export to prevent build errors about empty modules
export {};