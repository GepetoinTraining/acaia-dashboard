// PATH: app/api/stock/route.ts
// NOTE: This is the CORRECTED GET function including isPrepared

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, AggregatedIngredientStock } from "@/lib/types"; // Import new type
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET /api/stock
 * Fetches aggregated current stock levels for all ingredients by summing StockHoldings.
 * Includes the isPrepared flag.
 */
export async function GET(req: NextRequest) {
    const session = await getSession();
    // Re-enable auth check if needed later
    // if (!session.user?.isLoggedIn) {
    //     return NextResponse.json<ApiResponse>({ success: false, error: "Não autorizado" }, { status: 401 });
    // }

    try {
        // 1. Aggregate quantities from StockHolding, grouped by ingredientId
        const stockAggregations = await prisma.stockHolding.groupBy({
            by: ['ingredientId'],
            _sum: {
                quantity: true,
            },
        });

        // 2. Fetch all ingredient definitions to get name, unit, cost, isPrepared
        const ingredients = await prisma.ingredient.findMany({
            select: {
                id: true,
                name: true,
                unit: true,
                costPerUnit: true,
                isPrepared: true, // Fetch the flag
            }
        });

        // 3. Create a map for quick ingredient lookup
        const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]));

        // 4. Combine aggregations with ingredient definitions
        const aggregatedStockResult: AggregatedIngredientStock[] = stockAggregations.map((agg) => {
            const ingredient = ingredientMap.get(agg.ingredientId);
            const totalStock = agg._sum.quantity ?? new Decimal(0);

            // --- Ensure isPrepared is included here ---
            return {
                ingredientId: agg.ingredientId,
                name: ingredient?.name ?? "Ingrediente Desconhecido",
                unit: ingredient?.unit ?? "N/A",
                costPerUnit: ingredient?.costPerUnit.toString() ?? "0",
                totalStock: totalStock.toString(),
                isPrepared: ingredient?.isPrepared ?? false, // Add the flag
            };
            // --- End Fix ---
        });

        // 5. Add ingredients that exist but have zero stock (no holdings)
        for (const ingredient of ingredients) {
            if (!aggregatedStockResult.some(s => s.ingredientId === ingredient.id)) {
                // --- Ensure isPrepared is included here too ---
                aggregatedStockResult.push({
                    ingredientId: ingredient.id,
                    name: ingredient.name,
                    unit: ingredient.unit,
                    costPerUnit: ingredient.costPerUnit.toString(),
                    totalStock: "0",
                    isPrepared: ingredient.isPrepared, // Add the flag here too
                });
                // --- End Fix ---
            }
        }

        // Optional: Sort the final result
        aggregatedStockResult.sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json<ApiResponse<AggregatedIngredientStock[]>>(
            { success: true, data: aggregatedStockResult },
            { status: 200 }
        );

    } catch (error) {
        console.error("GET /api/stock error:", error); // Updated path in log
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao buscar estoque agregado de ingredientes" },
            { status: 500 }
        );
    }
}