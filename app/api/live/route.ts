// File: app/api/live/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
// --- FIX: Import Product type from lib/types ---
import { ApiResponse, LiveData, LiveClient, Product } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
// Removed unused Prisma Product import: import { Product } from "@prisma/client";

/**
 * GET /api/live (Refactored for Acaia)
 * Fetches data potentially needed for live views:
 * - Live clients (from Visits)
 * - All products (serialized with relations)
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
    // 1. Get Live Clients (Unchanged)
    const liveVisits = await prisma.visit.findMany({
      where: {
        exitTime: null,
      },
      include: {
        client: true,
        seatingArea: true
      },
       orderBy: { entryTime: 'desc' }
    });

    const liveClients: LiveClient[] = liveVisits.map((v) => ({
      visitId: v.id,
      clientId: v.client?.id ?? null,
      name: v.client?.name ?? `Anônimo (Visita ${v.id})`,
      seatingAreaId: v.seatingAreaId,
      seatingAreaName: v.seatingArea?.name
    }));

    // --- FIX START ---
    // 2. Get All Products with relations and serialize
    const productsRaw = await prisma.product.findMany({
       include: { // <<< Added include
           inventoryItem: true,
           partner: true,
       },
       orderBy: [{ type: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    });

    // Serialize Decimal fields before assembling liveData
    const products: Product[] = productsRaw.map(p => ({
        ...p,
        costPrice: Number(p.costPrice),
        salePrice: Number(p.salePrice),
        deductionAmountInSmallestUnit: Number(p.deductionAmountInSmallestUnit),
        // Serialize nested Decimals in inventoryItem
         inventoryItem: p.inventoryItem ? {
             ...p.inventoryItem,
             // Omit createdAt if necessary based on the type definition
             createdAt: undefined, // Add this if 'createdAt' causes issues
             storageUnitSizeInSmallest: p.inventoryItem.storageUnitSizeInSmallest ? Number(p.inventoryItem.storageUnitSizeInSmallest) : null,
             reorderThresholdInSmallest: p.inventoryItem.reorderThresholdInSmallest ? Number(p.inventoryItem.reorderThresholdInSmallest) : null,
         } : null,
         // partner doesn't have Decimals
    })) as unknown as Product[]; // Use type assertion after serialization
    // --- FIX END ---


    // Assemble LiveData
    // --- FIX: Ensure liveData type matches expected Partial<LiveData> ---
    const liveData: Partial<LiveData> = {
      clients: liveClients,
      products: products, // <<< Now assigning the serialized 'Product[]' type
    };

    // Return type matches the modified liveData
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