import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Host, HostStatus } from "@prisma/client";

/**
 * GET /api/hostesses
 * Fetches all hostesses.
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
    const hostesses = await prisma.host.findMany({
      orderBy: { status: "asc" },
    });
    return NextResponse.json<ApiResponse<Host[]>>(
      { success: true, data: hostesses },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hostesses error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar hostesses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hostesses
 * Creates a new hostess.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  // TODO: Add role check

  try {
    const body = await req.json();
    const {
      stageName,
      status,
      commissionRate,
      baseRate,
      isRateNegotiable,
      profileData,
    } = body;

    if (!stageName || !commissionRate || !baseRate) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const newHostess = await prisma.host.create({
      data: {
        stageName,
        status: status || HostStatus.new,
        commissionRate: parseFloat(commissionRate),
        baseRate: parseFloat(baseRate),
        isRateNegotiable: isRateNegotiable || false,
        profileData: profileData || {},
      },
    });

    return NextResponse.json<ApiResponse<Host>>(
      { success: true, data: newHostess },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/hostesses error:", error);
    if (error.code === "P2002") {
      // Unique constraint violation (e.g., stageName)
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Este nome de palco já está em uso" },
        { status: 400 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar hostess" },
      { status: 500 }
    );
  }
}
