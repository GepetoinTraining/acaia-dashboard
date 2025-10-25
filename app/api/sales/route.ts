// File: app/api/sales/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Sale, StaffRole, ClientStatus, Visit, Client, SeatingArea, StockMovementType, Product, InventoryItem } from "@prisma/client"; // Added Client, SeatingArea, StockMovementType, Product, InventoryItem

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
    seatingArea: SeatingArea | null; // Keep seatingArea relation
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

    if (!session.staff?.isLoggedIn || !session.staff.role) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado. Faça login." },
            { status: 401 }
        );
    }

    const isAllowedRole =
        session.staff.role === StaffRole.Server ||
        session.staff.role === StaffRole.Bartender ||
        session.staff.role === StaffRole.Manager ||
        session.staff.role === StaffRole.Admin;

    if (!isAllowedRole) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Função não autorizada para registrar vendas" },
            { status: 403 }
        );
    }

    const staffId = session.staff.id;

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
        // Use a more specific type that includes the relations we query for
        let visit: VisitWithRelations | null = await prisma.visit.findFirst({
            where: {
                seatingAreaId: seatingAreaId,
                exitTime: null, // Active visit
            },
            include: { client: true, seatingArea: true } // Include client and seatingArea
        });

        let clientId: number;

        if (!visit) {
            // No active visit found, create an anonymous client and a new visit
            const anonClient = await prisma.client.create({
                data: {
                    name: `Patrono #${Date.now().toString().slice(-6)}`,
                    phoneNumber: null,
                    status: ClientStatus.new,
                    crmData: defaultCrmData,
                }
            });
            clientId = anonClient.id;

            // Create the visit
            const createdVisit = await prisma.visit.create({
                data: {
                    clientId: clientId,
                    seatingAreaId: seatingAreaId,
                    entryFeePaid: 0,
                    consumableCreditTotal: 0,
                    consumableCreditRemaining: 0,
                }
            });
            // Re-fetch visit WITH relations to ensure 'visit' variable has the correct type
            visit = await prisma.visit.findUnique({
                 where: { id: createdVisit.id },
                 include: { client: true, seatingArea: true } // Include necessary relations
            });
            if (!visit) throw new Error("Falha ao buscar a visita recém-criada associada à mesa.");

        } else {
             // Use existing visit's client ID, ensuring it exists
             if (!visit.clientId) {
                   const anonClient = await prisma.client.create({
                       data: { name: `Patrono #${Date.now().toString().slice(-6)}`, status: ClientStatus.new, crmData: defaultCrmData }
                   });
                   clientId = anonClient.id;
                   // Update and re-fetch visit WITH relations
                   visit = await prisma.visit.update({
                       where: { id: visit.id },
                       data: { clientId: clientId },
                       include: { client: true, seatingArea: true } // Include relations
                   });
                   if (!visit) throw new Error("Falha ao associar cliente anônimo a visita existente.");

             } else {
                 clientId = visit.clientId;
             }
        }

        // --- FIX: Moved the check here, after 'visit' is guaranteed to be assigned ---
        // Ensure client relation exists on the final visit object
        if (!visit?.client) { // Added null check for visit itself just in case
             throw new Error("Cliente associado à visita não encontrado.");
        }
        // --- End Fix ---

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
                    lastVisitSpend: totalSaleAmount,
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
         const createdSalesResult = transactionResults[0];
         const salesCount = createdSalesResult?.count ?? 0;

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