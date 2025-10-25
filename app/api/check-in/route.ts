// File: app/api/sales/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Sale, StaffRole, ClientStatus, Visit, StockMovementType } from "@prisma/client"; // Added StockMovementType

// Define expected payload shape directly
interface AcaiaSalePayload {
    seatingAreaId: number;
    cart: {
        productId: number;
        quantity: number;
    }[];
}

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
        let visit = await prisma.visit.findFirst({
            where: {
                seatingAreaId: seatingAreaId,
                exitTime: null, // Active visit
            },
            include: { client: true, seatingArea: true } // Include seatingArea for notes
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

            visit = await prisma.visit.create({
                data: {
                    clientId: clientId,
                    seatingAreaId: seatingAreaId,
                    entryFeePaid: 0, // No entry fee via POS sale
                    consumableCreditTotal: 0, // No credit system
                    consumableCreditRemaining: 0,
                }
            });
            // Re-fetch visit with client and seatingArea included
            visit = await prisma.visit.findUnique({
                 where: { id: visit.id },
                 include: { client: true, seatingArea: true }
            });
            if (!visit) throw new Error("Falha ao criar nova visita associada à mesa.");

        } else {
            // Use existing visit's client ID
            if (!visit.clientId) {
                const anonClient = await prisma.client.create({
                    data: { name: `Patrono #${Date.now().toString().slice(-6)}`, status: ClientStatus.new, crmData: defaultCrmData }
                });
                clientId = anonClient.id;
                visit = await prisma.visit.update({
                    where: { id: visit.id },
                    data: { clientId: clientId },
                    include: { client: true, seatingArea: true } // Include seatingArea
                });
                if (!visit) throw new Error("Falha ao associar cliente anônimo a visita existente.");
            } else {
                clientId = visit.clientId;
            }
        }

        if (!visit.client) {
            throw new Error("Cliente associado à visita não encontrado.");
        }


        // --- 2. Get Product Data ---
        const products = await prisma.product.findMany({
            where: { id: { in: cart.map((item) => item.productId) } },
            // Include inventory item details needed for stock ledger
            include: { inventoryItem: true }
        });

        // --- 3. Calculate Totals & Prepare Sale Items ---
        let totalSaleAmount = 0; // Use number for calculations
        // Define Prisma.Decimal type alias for clarity if preferred, but not strictly needed
        // type PrismaDecimal = Prisma.Decimal;
        const saleItemsData: Prisma.SaleCreateManyInput[] = [];
        const stockLedgerData: Prisma.StockLedgerCreateManyInput[] = [];


        for (const item of cart) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new Error(`Produto ID ${item.productId} não encontrado no carrinho`);
            }

            const priceAtSale = Number(product.salePrice); // Convert Decimal to number
            const itemTotal = priceAtSale * item.quantity; // number calculation

            totalSaleAmount += itemTotal; // Add to number total

            saleItemsData.push({
                visitId: visit.id,
                productId: product.id,
                staffId: staffId,
                quantity: item.quantity,
                priceAtSale: priceAtSale, // Pass number to Decimal field
                totalAmount: itemTotal,   // Pass number to Decimal field
            });

             // Prepare stock ledger entry if applicable
             if (product.inventoryItem && product.inventoryItemId && product.deductionAmountInSmallestUnit) {
                 // Convert deduction amount Decimal to number, multiply by quantity, make negative
                const quantityChange = Number(product.deductionAmountInSmallestUnit) * item.quantity * -1;

                 stockLedgerData.push({
                     inventoryItemId: product.inventoryItemId,
                     movementType: StockMovementType.sale,
                     quantityChange: quantityChange, // Pass number to Decimal field
                     // Cannot link saleId directly here easily because of createMany
                     notes: `Venda de ${item.quantity}x ${product.name} (Visita ${visit.id})`,
                 });
             } else {
                  console.warn(`Skipping stock deduction for product ID ${item.productId} in visit ${visit.id}. Missing inventory link or deduction amount.`);
             }
        }


        // --- 4. Create Transaction ---
        const transactionPromises = [
            // 1. Create all Sale records
            prisma.sale.createMany({
                data: saleItemsData,
            }),

            // 2. Update Client lifetime stats
            prisma.client.update({
                where: { id: clientId },
                data: {
                    lifetimeSpend: { increment: totalSaleAmount }, // Pass number to Decimal field
                    lastVisitSpend: totalSaleAmount,              // Pass number to Decimal field
                    lastVisitDate: new Date(),
                },
            }),

            // 3. Log Staff commission (e.g., 2% of total)
            prisma.staffCommission.create({
                data: {
                    staffId: staffId,
                    commissionType: "sale",
                    amountEarned: totalSaleAmount * 0.02, // Pass number to Decimal field (2%)
                    relatedSaleId: undefined,
                    notes: `Comissão de 2% sobre venda de R$ ${totalSaleAmount.toFixed(2)} na ${visit.seatingArea?.name || 'mesa ' + seatingAreaId}`,
                }
            }),
        ];

        // 4. Add stock ledger creations if any exist
        if (stockLedgerData.length > 0) {
             transactionPromises.push(
                  prisma.stockLedger.createMany({ data: stockLedgerData })
             );
        }

        // Execute transaction
        const transactionResults = await prisma.$transaction(transactionPromises);

        // --- 5. Return Success ---
         const createdSalesResult = transactionResults[0]; // Result of createMany for sales
         const salesCount = createdSalesResult?.count ?? 0;

        return NextResponse.json<ApiResponse<{ salesCreated: number }>>(
            { success: true, data: { salesCreated: salesCount } },
            { status: 201 } // 201 Created
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