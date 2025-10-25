// File: app/api/products/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
// --- FIX: Import ProductType and Prisma ---
import { Product, ProductType, Prisma, StaffRole } from "@prisma/client";

/**
 * GET /api/products
 * Fetches all products with relations.
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
        const productsRaw = await prisma.product.findMany({
            include: {
                inventoryItem: true,
                partner: true,
            },
            orderBy: [{ type: 'asc'}, { category: "asc" }, { name: "asc" }] // Added type sort
        });

        // Serialize Decimal fields before sending
        const products = productsRaw.map(p => ({
            ...p,
            costPrice: Number(p.costPrice),
            salePrice: Number(p.salePrice),
            deductionAmountInSmallestUnit: Number(p.deductionAmountInSmallestUnit),
            // Serialize nested Decimals in inventoryItem if needed (depends on usage)
             inventoryItem: p.inventoryItem ? {
                 ...p.inventoryItem,
                 storageUnitSizeInSmallest: p.inventoryItem.storageUnitSizeInSmallest ? Number(p.inventoryItem.storageUnitSizeInSmallest) : null,
                 reorderThresholdInSmallest: p.inventoryItem.reorderThresholdInSmallest ? Number(p.inventoryItem.reorderThresholdInSmallest) : null,
             } : null,
             // partner doesn't have Decimals
        }));


        return NextResponse.json<ApiResponse<Product[]>>(
            { success: true, data: products as any }, // Cast needed after serialization
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/products error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao buscar produtos" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/products
 * Creates a new product.
 */
export async function POST(req: NextRequest) {
    const session = await getSession();
    // --- FIX: Added Role check ---
    if (!session.staff?.isLoggedIn || (session.staff.role !== StaffRole.Admin && session.staff.role !== StaffRole.Manager)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager Required)" },
            { status: 403 }
        );
    }


    try {
        // --- FIX: Add 'type' to body extraction ---
        const body = await req.json();
        const {
            name,
            category,
            type, // Added type
            costPrice,
            salePrice,
            inventoryItemId,
            deductionAmount,
            partnerId,
        } = body as { // Add type to the definition
            name: string;
            category?: string | null;
            type: ProductType; // Expect ProductType enum value
            costPrice?: number | string | null;
            salePrice: number | string;
            inventoryItemId: number | string; // Expect ID as number or string
            deductionAmount?: number | string | null;
            partnerId?: number | string | null;
        };

        // --- FIX: Add validation for 'type' ---
        if (!name || !salePrice || !inventoryItemId || !type) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Campos obrigatórios faltando (Nome, Preço Venda, Item Estoque, Tipo)" },
                { status: 400 }
            );
        }
        // Validate type against enum values
         if (!Object.values(ProductType).includes(type)) {
             return NextResponse.json<ApiResponse>(
                 { success: false, error: `Tipo de produto inválido: ${type}` },
                 { status: 400 }
             );
         }
        // Validate numeric inputs
        const numSalePrice = parseFloat(String(salePrice));
        const numCostPrice = costPrice ? parseFloat(String(costPrice)) : 0;
        const numDeductionAmount = deductionAmount ? parseFloat(String(deductionAmount)) : 1;
        const numInventoryItemId = parseInt(String(inventoryItemId));
        const numPartnerId = partnerId ? parseInt(String(partnerId)) : null;

        if (isNaN(numSalePrice) || numSalePrice <= 0) {
             return NextResponse.json<ApiResponse>({ success: false, error: "Preço de venda inválido." }, { status: 400 });
        }
         if (isNaN(numCostPrice) || numCostPrice < 0) {
              return NextResponse.json<ApiResponse>({ success: false, error: "Preço de custo inválido." }, { status: 400 });
         }
        if (isNaN(numDeductionAmount) || numDeductionAmount <= 0) {
             return NextResponse.json<ApiResponse>({ success: false, error: "Valor de dedução inválido." }, { status: 400 });
        }
        if (isNaN(numInventoryItemId)) {
             return NextResponse.json<ApiResponse>({ success: false, error: "ID do item de inventário inválido." }, { status: 400 });
        }
        if (partnerId && (numPartnerId === null || isNaN(numPartnerId))) {
             return NextResponse.json<ApiResponse>({ success: false, error: "ID do parceiro inválido." }, { status: 400 });
        }
        // --- End Validation ---


        const newProduct = await prisma.product.create({
            data: {
                name: name.trim(),
                category: category?.trim() || null,
                // --- FIX: Include 'type' in data object ---
                type: type,
                costPrice: numCostPrice, // Pass number to Prisma
                salePrice: numSalePrice, // Pass number to Prisma
                deductionAmountInSmallestUnit: numDeductionAmount, // Pass number to Prisma
                inventoryItemId: numInventoryItemId, // Pass number id
                partnerId: numPartnerId, // Pass number id or null
                // prepStation might need to be added here if it becomes required or settable via UI
            },
        });

         // Serialize Decimal before returning
         const serializedProduct = {
             ...newProduct,
             costPrice: Number(newProduct.costPrice),
             salePrice: Number(newProduct.salePrice),
             deductionAmountInSmallestUnit: Number(newProduct.deductionAmountInSmallestUnit),
         };

        return NextResponse.json<ApiResponse<Product>>(
            { success: true, data: serializedProduct as any }, // Cast needed
            { status: 201 }
        );
    } catch (error: any) {
        console.error("POST /api/products error:", error);
        // Add specific error handling if needed (e.g., unique constraints)
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             // Basic unique constraint error
              return NextResponse.json<ApiResponse>(
                  { success: false, error: `Falha: ${error.meta?.target}` },
                  { status: 409 } // Conflict
              );
         }
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao criar produto" },
            { status: 500 }
        );
    }
}