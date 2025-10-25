import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { InventoryItem, SmallestUnit, Prisma } from "@prisma/client";

// Define a type for the data structure returned by the 'select' query
// REMOVED createdAt
type SelectedInventoryItem = {
  id: number;
  name: string;
  storageUnitName: string | null;
  smallestUnit: SmallestUnit;
  storageUnitSizeInSmallest: Prisma.Decimal | null;
  reorderThresholdInSmallest: Prisma.Decimal | null;
  // createdAt: Date; // REMOVED
};

// Define the final serialized type
// REMOVED createdAt from Omit if it was there implicitly
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
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    // REMOVED createdAt from select
    const items: SelectedInventoryItem[] = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        storageUnitName: true,
        smallestUnit: true,
        storageUnitSizeInSmallest: true,
        reorderThresholdInSmallest: true,
        // createdAt: true, // REMOVED
      },
      orderBy: { name: "asc" },
    });

    // Convert Prisma Decimal fields to numbers
    // REMOVED createdAt from mapping
    const serializedItems: SerializedInventoryItem[] = items.map(item => ({
       id: item.id,
       name: item.name,
       storageUnitName: item.storageUnitName,
       smallestUnit: item.smallestUnit,
       // createdAt: item.createdAt, // REMOVED
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