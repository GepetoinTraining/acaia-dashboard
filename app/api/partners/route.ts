import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Partner } from "@prisma/client";

/**
 * GET /api/partners
 * Fetches all partners.
 * This is used by the "Create Product" modal for consignment.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const partners = await prisma.partner.findMany({
      orderBy: { companyName: "asc" },
    });
    return NextResponse.json<ApiResponse<Partner[]>>(
      { success: true, data: partners },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/partners error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar parceiros" },
      { status: 500 }
    );
  }
}
