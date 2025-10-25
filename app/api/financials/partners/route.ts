import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/financials/partner
 * Marks a single partner payout as paid.
 * ADMIN-only route.
 */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn || session.staff.pin !== "1234") {
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

    await prisma.partnerPayout.update({
      where: { id: payoutId },
      data: { isPaidOut: true },
    });

    return NextResponse.json<ApiResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/financials/partner error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao marcar pagamento como pago" },
      { status: 500 }
    );
  }
}
