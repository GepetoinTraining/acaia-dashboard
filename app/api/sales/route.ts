// File: app/api/sales/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types"; // Removed SalePayload, using AcaiaSalePayload shape inline
import { NextRequest, NextResponse } from "next/server";
import { Prisma, Sale, StaffRole, ClientStatus, Visit } from "@prisma/client"; // Added ClientStatus, Visit

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

    // Check staff login and shift (though shiftId might not be strictly needed if commission linked to staffId)
    if (!session.staff?.isLoggedIn || !session.staff.role) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado. Faça login." }, // Updated message slightly
            { status: 401 }
        );
    }

    // Role check: Allow Server, Bartender, or Admin (using PIN check as stand-in)
    const isAllowedRole =
        session.staff.role === StaffRole.Server ||
        session.staff.role === StaffRole.Bartender ||
        session.staff.role === StaffRole.Manager || // Added Manager
        session.staff.role === StaffRole.Admin;    // Added Admin
    // const isAdminOverride = session.staff.pin === "1234"; // Keep admin override? Maybe rely on role.

    if (!isAllowedRole /* && !isAdminOverride */) {
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
        let visit: Visit | null = await prisma.visit.findFirst({
            where: {
                seatingAreaId: seatingAreaId,
                exitTime: null, // Active visit
            },
             include: { client: true } // Include client for updates later
        });

        let clientId: number;

        if (!visit) {
            // No active visit found, create an anonymous client and a new visit
            const anonClient = await prisma.client.create({
                data: {
                    name: `Patrono #${Date.now().toString().slice(-6)}`, // Simple unique-ish anonymous name
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
                    entryFeePaid: new Prisma.Decimal(0), // No entry fee via POS sale
                    consumableCreditTotal: new Prisma.Decimal(0), // No credit system
                    consumableCreditRemaining: new Prisma.Decimal(0),
                }
            });
             // Re-fetch visit with client included after creation
            visit = await prisma.visit.findUnique({ where: { id: visit.id }, include: { client: true } });
            if (!visit) throw new Error("Falha ao criar nova visita associada à mesa.");

        } else {
             // Use existing visit's client ID
             if (!visit.clientId) {
                  // This case *shouldn't* happen if check-in/previous logic is correct, but handle defensively
                  // Create an anonymous client and link it to the existing visit
                   const anonClient = await prisma.client.create({
                       data: { name: `Patrono #${Date.now().toString().slice(-6)}`, status: ClientStatus.new, crmData: defaultCrmData }
                   });
                   clientId = anonClient.id;
                   visit = await prisma.visit.update({
                       where: { id: visit.id },
                       data: { clientId: clientId },
                       include: { client: true }
                   });
                   if (!visit) throw new Error("Falha ao associar cliente anônimo a visita existente.");

             } else {
                 clientId = visit.clientId;
             }
        }
        // Ensure client exists on the visit object for later updates
        if (!visit.client) {
             throw new Error("Cliente associado à visita não encontrado.");
        }


        // --- 2. Get Product Data ---
        const products = await prisma.product.findMany({
            where: { id: { in: cart.map((item) => item.productId) } },
        });

        // --- 3. Calculate Totals & Prepare Sale Items ---
        let totalSaleAmount = new Prisma.Decimal(0); // Use Decimal for precision
        const saleItemsData: Prisma.SaleCreateManyInput[] = [];

        for (const item of cart) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new Error(`Produto ID ${item.productId} não encontrado no carrinho`);
            }

            // Calculations with Decimal
            const priceAtSale = product.salePrice; // Already Decimal
            const itemTotal = priceAtSale.times(item.quantity); // Decimal multiplication

            totalSaleAmount = totalSaleAmount.plus(itemTotal); // Decimal addition

            saleItemsData.push({
                visitId: visit.id,
                productId: product.id,
                staffId: staffId, // Staff who processed the sale
                quantity: item.quantity,
                priceAtSale: priceAtSale, // Store Decimal price per unit
                totalAmount: itemTotal, // Store Decimal total for this line item
                // Removed hostId, commissionEarned, paidWithCredit, paidWithCashCard
            });
        }
        const totalSaleAmountNumber = totalSaleAmount.toNumber(); // Convert for logs/commission calc if needed


        // --- 4. Create Transaction ---
        const transactionResults = await prisma.$transaction([
            // 1. Create all Sale records
            prisma.sale.createMany({
                data: saleItemsData,
            }),

            // 2. Update Client lifetime stats
            prisma.client.update({
                where: { id: clientId },
                data: {
                    lifetimeSpend: { increment: totalSaleAmount }, // Use Decimal directly
                    lastVisitSpend: totalSaleAmount,              // Set Decimal directly
                    lastVisitDate: new Date(),
                    // Increment totalVisits ONLY if this is the first sale for this visit?
                    // Let's check if there were previous sales for this visit ID before this transaction
                    // totalVisits: { increment: existingSalesCount === 0 ? 1 : 0 } // Needs pre-query, complex. Defer for now.
                    // Keep it simple: update last visit date/spend. Analytics can derive visit count.
                },
            }),

            // 3. Log Staff commission (e.g., 2% of total - adjust rate as needed)
            prisma.staffCommission.create({
                data: {
                    staffId: staffId,
                    commissionType: "sale", // Use the enum value if defined, otherwise string
                    amountEarned: totalSaleAmount.times(0.02), // Decimal calculation (2%)
                    relatedSaleId: undefined, // Cannot easily link to createMany result IDs
                    notes: `Comissão de 2% sobre venda de R$ ${totalSaleAmountNumber.toFixed(2)} na ${visit.seatingArea?.name || 'mesa ' + seatingAreaId}`, // Added context
                }
            }),

             // 4. Update Stock Ledger (Deduct inventory)
             // Need to iterate through saleItemsData *after* product info is confirmed
             ...saleItemsData.map(saleItem => {
                 const product = products.find(p => p.id === saleItem.productId);
                 if (!product || !product.inventoryItemId || !product.deductionAmountInSmallestUnit) {
                     // If product doesn't exist, has no inventory link, or no deduction amount, skip ledger entry
                     // Consider logging a warning here
                     console.warn(`Skipping stock deduction for product ID ${saleItem.productId} in visit ${saleItem.visitId}. Missing inventory link or deduction amount.`);
                     // Return a placeholder that doesn't cause a Prisma operation, like finding the product again which resolves quickly.
                     // IMPORTANT: Returning `null` or `undefined` here will break $transaction.
                     return prisma.product.findUnique({ where: { id: saleItem.productId } }); // Safe no-op within transaction
                 }
                 const quantityChangeDecimal = product.deductionAmountInSmallestUnit.times(saleItem.quantity).negated(); // Make it negative for deduction

                 return prisma.stockLedger.create({
                     data: {
                         inventoryItemId: product.inventoryItemId,
                         movementType: StockMovementType.sale,
                         quantityChange: quantityChangeDecimal, // Use the calculated negative Decimal
                         // Cannot link saleId directly here easily because of createMany
                         notes: `Venda de ${saleItem.quantity}x ${product.name} (Visita ${saleItem.visitId})`,
                     }
                 });
             })
        ]);

        // --- 5. Return Success ---
        // Find the IDs of the sales created (requires another query after transaction)
        // For MVP, just return success status.
         const createdSalesResult = transactionResults[0]; // Result of createMany
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