// File: app/api/live/route.ts
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { getSession } from "@/lib/auth"; // Adjust path if needed
import { ApiResponse, LiveData, LiveClient } from "@/lib/types"; // Removed LiveHostess
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@prisma/client";

/**
 * GET /api/live (Refactored for Acaia)
 * Fetches data potentially needed for live views:
 * - Live clients (from Visits) - Definition might need adjustment
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
    // 1. Get Live Clients (Consider if this exact structure is still needed)
    // This fetches all active visits, which might be useful for a general overview
    const liveVisits = await prisma.visit.findMany({
      where: {
        exitTime: null, // Client is in the club
      },
      include: {
        client: true,
        seatingArea: true // Include seating area info
      },
       orderBy: { entryTime: 'desc' }
    });

    // Map to simplified LiveClient type (adjust as needed)
    const liveClients: LiveClient[] = liveVisits.map((v) => ({
      visitId: v.id,
      clientId: v.client?.id ?? null, // Can be null
      name: v.client?.name ?? `Anônimo (Visita ${v.id})`, // Can be null
      seatingAreaId: v.seatingAreaId,
      seatingAreaName: v.seatingArea?.name
      // consumableCreditRemaining: 0, // Removed credit
    }));

    // 2. Get Live Hostesses (REMOVED)
    // const liveShifts = await prisma.hostShift.findMany({...});
    // const liveHostesses: LiveHostess[] = liveShifts.map((s) => ({...}));

    // 3. Get All Products (Keep for POS)
    const products = await prisma.product.findMany({
       orderBy: [{ type: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    });

    // Assemble LiveData (hostesses removed)
    const liveData: Partial<LiveData> = { // Made partial as clients might be refactored
      clients: liveClients,
      // hostesses: [], // Removed hostess data
      products: products,
    };

    return NextResponse.json<ApiResponse<Partial<LiveData>>>(
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