import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/financials/staff
 * Marks a single staff commission as paid.
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
    const { commissionId } = body;

    if (!commissionId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "ID da comissão é obrigatório" },
        { status: 400 }
      );
    }

    await prisma.staffCommission.update({
      where: { id: commissionId },
      data: { isPaidOut: true },
    });

    return NextResponse.json<ApiResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PATCH /api/financials/staff error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao marcar comissão como paga" },
      { status: 500 }
    );
  }
}
