// File: app/api/inventory/items/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
// --- FIX: Import UnitOfMeasure instead of SmallestUnit ---
import { InventoryItem, UnitOfMeasure, Prisma } from "@prisma/client";

// Define a type for the data structure returned by the 'select' query
type SelectedInventoryItem = {
  id: number;
  name: string;
  storageUnitName: string | null;
  // --- FIX: Use UnitOfMeasure ---
  smallestUnit: UnitOfMeasure;
  storageUnitSizeInSmallest: Prisma.Decimal | null;
  reorderThresholdInSmallest: Prisma.Decimal | null;
};

// Define the final serialized type
type SerializedInventoryItem = Omit<SelectedInventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest'> & {
  storageUnitSizeInSmallest: number | null;
  reorderThresholdInSmallest: number | null;
};


/**
 * GET /api/inventory/items
 * Fetches all defined InventoryItem records.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const items: SelectedInventoryItem[] = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        storageUnitName: true,
        smallestUnit: true, // This field uses UnitOfMeasure enum
        storageUnitSizeInSmallest: true,
        reorderThresholdInSmallest: true,
      },
      orderBy: { name: "asc" },
    });

    // Convert Prisma Decimal fields to numbers
    const serializedItems: SerializedInventoryItem[] = items.map(item => ({
       id: item.id,
       name: item.name,
       storageUnitName: item.storageUnitName,
       smallestUnit: item.smallestUnit, // Field name remains smallestUnit
       // Overwrite the Decimal fields with their number equivalents
      storageUnitSizeInSmallest: item.storageUnitSizeInSmallest ? Number(item.storageUnitSizeInSmallest) : null,
      reorderThresholdInSmallest: item.reorderThresholdInSmallest ? Number(item.reorderThresholdInSmallest) : null,
    }));


    return NextResponse.json<ApiResponse<SerializedInventoryItem[]>>(
      { success: true, data: serializedItems },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/inventory/items error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar itens de inventário" },
      { status: 500 }
    );
  }
}