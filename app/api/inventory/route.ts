import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, AggregatedStock } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { InventoryItem, StockMovementType } from "@prisma/client";

/**
 * GET /api/inventory?aggregate=true
 * Fetches aggregated current stock levels for all items.
 */
async function getAggregatedStock() {
  try {
    const stockMovements = await prisma.stockLedger.groupBy({
      by: ["inventoryItemId"],
      _sum: {
        quantityChange: true,
      },
    });

    const items = await prisma.inventoryItem.findMany();
    const itemsMap = new Map(items.map((item) => [item.id, item]));

    const aggregatedStock: AggregatedStock[] = stockMovements.map((move) => {
      const item = itemsMap.get(move.inventoryItemId);
      // Prisma's _sum can return a Decimal, so convert it to a number
      const currentStock = Number(move._sum.quantityChange || 0);
      return {
        inventoryItemId: move.inventoryItemId,
        name: item?.name || "Item Desconhecido",
        smallestUnit: item?.smallestUnit || "unit",
        totalStock: currentStock, // <-- FIX 1: Renamed currentStock to totalStock
        // Convert Decimal to number
        reorderThreshold: item?.reorderThresholdInSmallest
          ? Number(item.reorderThresholdInSmallest)
          : null,
      };
    });

    // Add items that are defined but have no stock movements yet
    for (const item of items) {
      if (!aggregatedStock.find((s) => s.inventoryItemId === item.id)) {
        aggregatedStock.push({
          inventoryItemId: item.id,
          name: item.name,
          smallestUnit: item.smallestUnit,
          totalStock: 0, // <-- FIX 2: Renamed currentStock to totalStock
          reorderThreshold: item?.reorderThresholdInSmallest
            ? Number(item.reorderThresholdInSmallest)
            : null,
        });
      }
    }

    // Convert all Prisma.Decimal to string or number for JSON serialization
    const serializedStock = aggregatedStock.map((s) => ({
      ...s,
      totalStock: s.totalStock, // <-- FIX 3: Renamed currentStock to totalStock
      reorderThreshold: s.reorderThreshold,
    }));

    return NextResponse.json<ApiResponse<AggregatedStock[]>>(
      { success: true, data: serializedStock as any }, // 'as any' to bypass complex type check
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/inventory (aggregate) error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar estoque agregado" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  if (searchParams.get("aggregate") === "true") {
    return getAggregatedStock();
  }
  // TODO: Add non-aggregated fetch?
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Endpoint não encontrado" },
    { status: 404 }
  );
}

/**
 * POST /api/inventory
 * Creates a new *InventoryItem* definition.
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
      name,
      storageUnitName,
      smallestUnit,
      storageUnitSize,
      reorderThreshold,
    } = body;

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        storageUnitName,
        smallestUnit,
        storageUnitSizeInSmallest: parseFloat(storageUnitSize),
        reorderThresholdInSmallest: parseFloat(reorderThreshold) || null,
      },
    });

    return NextResponse.json<ApiResponse<InventoryItem>>(
      { success: true, data: newItem },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar item" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/inventory
 * Adds a new entry to the *StockLedger* (e.g., a purchase).
 */
export async function PATCH(req: NextRequest) {
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
    // Treat quantity as string/any from JSON, not a guaranteed number
    const {
      inventoryItemId,
      quantityInStorageUnits,
      movementType,
      notes,
    } = body as {
      inventoryItemId: number;
      quantityInStorageUnits: any; // <-- More honest typing
      movementType: StockMovementType;
      notes: string;
    };

    const itemDef = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
    });
    if (!itemDef) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Item de inventário não encontrado" },
        { status: 404 }
      );
    }

    // ---
    // ** THE FIX IS HERE **
    // ---
    // 1. Convert the Prisma.Decimal to a plain number
    const sizeInSmallest = Number(itemDef.storageUnitSizeInSmallest || 1);
    // 2. Convert the input (which is a string) to a plain number
    const quantity = parseFloat(quantityInStorageUnits);

    // 3. Now all math is with plain numbers
    let quantityChange = sizeInSmallest * quantity;
    // ---

    // If it's waste or adjustment, it's a negative movement
    if (
      movementType === StockMovementType.waste ||
      movementType === StockMovementType.adjustment
    ) {
      quantityChange = -Math.abs(quantityChange);
    }

    const newLedgerEntry = await prisma.stockLedger.create({
      data: {
        inventoryItemId,
        movementType,
        quantityChange, // This is now a 'number', which is fine
        notes,
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: newLedgerEntry },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/inventory error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao adicionar ao estoque" },
      { status: 500 }
    );
  }
}

