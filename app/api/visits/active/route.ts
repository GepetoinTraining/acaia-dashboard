// PATH: app/api/visits/active/route.ts
// NOTE: This is a NEW FILE.
// This route is used by the POS to find active visits by Tab (RFID) or Client name.

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Visit, Client, Tab } from "@prisma/client";

// Define the response type, which includes related models
export type ActiveVisitResponse = Visit & {
  client: Client;
  tab: Tab;
};

/**
 * GET /api/visits/active
 * Fetches all active visits (those not checked out)
 * Can be filtered by a search query (Tab RFID or Client Name)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    const visits = await prisma.visit.findMany({
      where: {
        // Find visits that are NOT checked out
        checkOutAt: null,
        // Optional filter
        ...(query && {
          OR: [
            {
              // Search by Tab (RFID)
              tab: {
                rfid: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              // Search by Client Name
              client: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              // Search by Client Phone
              client: {
                phone: {
                  contains: query,
                },
              },
            },
          ],
        }),
      },
      include: {
        client: true, // Include the client details
        tab: true, // Include the tab details
      },
      orderBy: {
        checkInAt: "desc",
      },
    });

    // Serialize Decimal fields
    const serializedVisits = visits.map((visit) => ({
      ...visit,
      totalSpent: visit.totalSpent.toString(),
    }));

    return NextResponse.json<ApiResponse<any[]>>(
      { success: true, data: serializedVisits },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching active visits:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}