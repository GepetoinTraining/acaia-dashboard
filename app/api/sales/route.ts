// File: app/api/sales/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
// --- FIX: Removed BatchPayload from direct import ---
import { Prisma, Sale, Role, ClientStatus, Visit, Client, SeatingArea, StockMovementType, Product, InventoryItem } from "@prisma/client";

// Define expected payload shape directly
interface AcaiaSalePayload {
    seatingAreaId: number;
    cart: {
        productId: number;
        quantity: number;
    }[];
}

// Define the type for Visit including potential relations we use
type VisitWithRelations = Visit & {
    client: Client | null;
    seatingArea: SeatingArea | null;
};


// Default CRM data for anonymous client creation
const defaultCrmData = Prisma.JsonNull;

/**
 * POST /api/sales (Refactored for Acaia)
 * Creates new sales linked to a seating area.
 * Finds an existing active visit for the area OR creates a new anonymous client & visit.
 */
export async function POST(req: NextRequest) {
    const session = await getSession();

    if (!session.user?.isLoggedIn || !session.user.role) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado. Faça login." },
            { status: 401 }
        );
    }

    const isAllowedRole =
        session.user.role === Role.Server ||
        session.user.role === Role.Bartender ||
        session.user.role === Role.Manager ||
        session.user.role === Role.OWNER;

    if (!isAllowedRole) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Função não autorizada para registrar vendas" },
            { status: 403 }
        );
    }

    const staffId = session.user.id;

    try {
        const body: AcaiaSalePayload = await req.json();
        const { seatingAreaId, cart } = body;

        if (!seatingAreaId || !cart || cart.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Dados da venda inválidos (mesa e carrinho obrigatórios)" },
                { status: 400 }
            );
        }

        // --- 1. Find or Create Visit ---
        let visit: VisitWithRelations | null = await prisma.visit.findFirst({
            where: {
                seatingAreaId: seatingAreaId,
                exitTime: null,
            },
            include: { client: true, seatingArea: true }
        });

        let clientId: number;

        if (!visit) {
            const anonClient = await prisma.client.create({
                data: {
                    name: `Patrono #${Date.now().toString().slice(-6)}`,
                    phoneNumber: null,
                    status: ClientStatus.new,
                    crmData: defaultCrmData,
                }
            });
            clientId = anonClient.id;

            const createdVisit = await prisma.visit.create({
                data: {
                    clientId: clientId,
                    seatingAreaId: seatingAreaId,
                    entryFeePaid: 0,
                    consumableCreditTotal: 0,
                    consumableCreditRemaining: 0,
                }
            });
            visit = await prisma.visit.findUnique({
                 where: { id: createdVisit.id },
                 include: { client: true, seatingArea: true }
            });
            if (!visit) throw new Error("Falha ao buscar a visita recém-criada associada à mesa.");

        } else {
             if (!visit.clientId) {
                   const anonClient = await prisma.client.create({
                       data: { name: `Patrono #${Date.now().toString().slice(-6)}`, status: ClientStatus.new, crmData: defaultCrmData }
                   });
                   clientId = anonClient.id;
                   visit = await prisma.visit.update({
                       where: { id: visit.id },
                       data: { clientId: clientId },
                       include: { client: true, seatingArea: true }
                   });
                   if (!visit) throw new Error("Falha ao associar cliente anônimo a visita existente.");

             } else {
                 clientId = visit.clientId;
             }
        }

        if (!visit?.client) {
             throw new Error("Cliente associado à visita não encontrado.");
        }

        // --- 2. Get Product Data ---
        const products = await prisma.product.findMany({
            where: { id: { in: cart.map((item) => item.productId) } },
            include: { inventoryItem: true }
        });

        // --- 3. Calculate Totals & Prepare Sale Items ---
        let totalSaleAmount = 0;
        const saleItemsData: Prisma.SaleCreateManyInput[] = [];
        const stockLedgerData: Prisma.StockLedgerCreateManyInput[] = [];

        for (const item of cart) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new Error(`Produto ID ${item.productId} não encontrado no carrinho`);
            }

            const priceAtSale = Number(product.salePrice);
            const itemTotal = priceAtSale * item.quantity;
            totalSaleAmount += itemTotal;

            saleItemsData.push({
                visitId: visit.id,
                productId: product.id,
                staffId: staffId,
                quantity: item.quantity,
                priceAtSale: priceAtSale,
                totalAmount: itemTotal,
            });

             if (product.inventoryItem && product.inventoryItemId && product.deductionAmountInSmallestUnit) {
                const quantityChange = Number(product.deductionAmountInSmallestUnit) * item.quantity * -1;
                 stockLedgerData.push({
                     inventoryItemId: product.inventoryItemId,
                     movementType: StockMovementType.sale,
                     quantityChange: quantityChange,
                     notes: `Venda de ${item.quantity}x ${product.name} (Visita ${visit.id})`,
                 });
             } else {
                  console.warn(`Skipping stock deduction for product ID ${item.productId} in visit ${visit.id}. Missing link or amount.`);
             }
        }

        // --- 4. Create Transaction ---
        const transactionPromises = [
            prisma.sale.createMany({ data: saleItemsData }),
            prisma.client.update({
                where: { id: clientId },
                data: {
                    lifetimeSpend: { increment: totalSaleAmount },
                    lastVisitDate: new Date(),
                },
            }),
            prisma.staffCommission.create({
                data: {
                    staffId: staffId,
                    commissionType: "sale",
                    amountEarned: totalSaleAmount * 0.02, // 2%
                    relatedSaleId: undefined,
                    notes: `Comissão de 2% sobre venda de R$ ${totalSaleAmount.toFixed(2)} na ${visit.seatingArea?.name || 'mesa ' + seatingAreaId}`,
                }
            }),
        ];
        if (stockLedgerData.length > 0) {
             transactionPromises.push(prisma.stockLedger.createMany({ data: stockLedgerData }));
        }
        const transactionResults = await prisma.$transaction(transactionPromises);

        // --- 5. Return Success ---
         // --- FIX: Use Prisma.BatchPayload for the cast ---
         const createdSalesResult = transactionResults[0] as Prisma.BatchPayload;
         const salesCount = createdSalesResult?.count ?? 0;
         // --- End Fix ---

        return NextResponse.json<ApiResponse<{ salesCreated: number }>>(
            { success: true, data: { salesCreated: salesCount } },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("POST /api/sales error:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json<ApiResponse>(
            { success: false, error: `Erro ao processar venda: ${errorMessage}` },
            { status: 500 }
        );
    }
}