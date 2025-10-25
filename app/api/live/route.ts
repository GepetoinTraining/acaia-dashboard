import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, LiveData, LiveClient, LiveHostess } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@prisma/client";

/**
 * GET /api/live
 * Fetches all "live" data needed for the POS:
 * - Live clients (from Visits)
 * - Live hostesses (from HostShifts)
 * - All products
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
    // 1. Get Live Clients
    const liveVisits = await prisma.visit.findMany({
      where: {
        exitTime: null, // Client is in the club
      },
      include: {
        client: true,
      },
    });

// Convert Prisma.Decimal to number
    const liveClients: LiveClient[] = liveVisits.map((v) => ({
      visitId: v.id,
      clientId: v.client?.id || 0,
      name: v.client?.name || `Anônimo (Visita ${v.id})`,
      consumableCreditRemaining: Number(v.consumableCreditRemaining), // <-- CONVERTED TO NUMBER
    }));

    // 2. Get Live Hostesses
    const liveShifts = await prisma.hostShift.findMany({
      where: {
        clockOut: null, // Hostess is checked in
        liveStatus: "available", // Is not already reserved
      },
      include: {
        host: true,
      },
    });

    const liveHostesses: LiveHostess[] = liveShifts.map((s) => ({
      shiftId: s.id,
      hostId: s.host.id,
      stageName: s.host.stageName,
    }));

    // 3. Get All Products
    const products = await prisma.product.findMany({
      orderBy: { category: "asc" },
    });

    const liveData: LiveData = {
      clients: liveClients,
      hostesses: liveHostesses,
      products: products,
    };

    return NextResponse.json<ApiResponse<LiveData>>(
      { success: true, data: liveData },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/live error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar dados ao vivo" },
      { status: 500 }
    );
  }
}

