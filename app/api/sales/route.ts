import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, SalePayload } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
// Ensure Prisma, Sale, and StaffRole are imported
import { Prisma, Sale, StaffRole } from "@prisma/client";

/**
 * POST /api/sales
 * Creates a new sale, updates client credit, calculates commission.
 * This is the main transaction engine.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();

  // Check if staff is logged in and has necessary session info
  if (
    !session.staff?.isLoggedIn ||
    !session.staff.shiftId ||
    !session.staff.role // Make sure role exists
  ) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado. Faça check-in." },
      { status: 401 }
    );
  }

  // Only Servers, Bartenders, or Admins (implied by PIN check) can make sales
  // Use direct comparison instead of .includes()
  const isAllowedRole = session.staff.role === StaffRole.Server || session.staff.role === StaffRole.Bartender;
  const isAdminOverride = session.staff.pin === "1234"; // Check if PIN matches admin

  if (!isAllowedRole && !isAdminOverride) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Função não autorizada para vendas" },
      { status: 403 }
    );
  }


  const staffShiftId = session.staff.shiftId;
  const staffId = session.staff.id;

  try {
    const body: SalePayload = await req.json();
    const { visitId, hostId, cart } = body;

    if (!visitId || !hostId || !cart || cart.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Dados da venda inválidos" },
        { status: 400 }
      );
    }

    // --- 1. Get all required data in one go ---
    const [visit, host, products] = await Promise.all([
      prisma.visit.findUnique({ where: { id: visitId }, include: { client: true } }), // Include client here
      prisma.host.findUnique({ where: { id: hostId } }),
      prisma.product.findMany({
        where: { id: { in: cart.map((item) => item.productId) } },
      }),
    ]);

    // Added null check for visit.client
    if (!visit || !visit.client)
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Visita ou cliente não encontrado(a)" },
        { status: 404 }
      );
    if (!host)
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Hostess não encontrada" },
        { status: 404 }
      );

    // --- 2. Calculate totals and commissions ---
    let totalSaleAmount = 0;
    let totalCommission = 0;
    const saleItemsData: Prisma.SaleCreateManyInput[] = [];

    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      if (!product)
        throw new Error(`Produto ID ${item.productId} não encontrado`);

      // Convert Prisma Decimals to JavaScript numbers
      const priceAtSale = Number(product.salePrice);
      const hostCommissionRate = Number(host.commissionRate);

      const itemTotal = priceAtSale * item.quantity; // Now number * number
      const itemCommission = itemTotal * hostCommissionRate; // Now number * number

      totalSaleAmount += itemTotal;
      totalCommission += itemCommission;

      // Prepare sale data (will be bulk-created inside transaction)
      saleItemsData.push({
        visitId: visit.id,
        hostId: host.id,
        productId: product.id,
        staffShiftId: staffShiftId,
        quantity: item.quantity,
        priceAtSale: priceAtSale, // Store as number for now
        commissionEarned: itemCommission, // Store as number for now
        // Payment split will be set after credit calculation
        paidWithCredit: 0, // Initialize
        paidWithCashCard: 0, // Initialize
      });
    }

    // --- 3. Calculate payment split ---
    // Convert Decimal credit to a number first
    const currentCreditNumber = Number(visit.consumableCreditRemaining);

    const creditToUse = Math.min(
      currentCreditNumber, // Now a number
      totalSaleAmount      // Already a number
    );
    const cashToCharge = totalSaleAmount - creditToUse; // Now number - number
    const newCreditRemaining = currentCreditNumber - creditToUse; // Now number - number

    // Apply payment split and convert numbers back to Decimal for Prisma
    saleItemsData.forEach((item, index) => {
      if (index === 0) {
        // Ensure Prisma receives Decimal
        item.paidWithCredit = new Prisma.Decimal(creditToUse);
        item.paidWithCashCard = new Prisma.Decimal(cashToCharge);
      } else {
        item.paidWithCredit = new Prisma.Decimal(0);
        item.paidWithCashCard = new Prisma.Decimal(0);
      }
      // Ensure commissionEarned and priceAtSale are also Decimals for Prisma
      item.priceAtSale = new Prisma.Decimal(item.priceAtSale as number);
      item.commissionEarned = new Prisma.Decimal(item.commissionEarned as number);
    });


    // --- 4. Create Transaction ---
    const transactionResults = await prisma.$transaction([
      // 1. Create all Sale records
      prisma.sale.createMany({
        data: saleItemsData,
      }),

      // 2. Update Visit credit
      prisma.visit.update({
        where: { id: visit.id },
        data: {
          // Prisma expects Decimal here
          consumableCreditRemaining: new Prisma.Decimal(newCreditRemaining),
        },
      }),

      // 3. Update Client lifetime stats
      prisma.client.update({
        where: { id: visit.clientId! }, // We know this exists from the visit check
        data: {
          // Use Prisma.Decimal for increments/sets
          lifetimeSpend: { increment: new Prisma.Decimal(totalSaleAmount) },
          lastVisitSpend: new Prisma.Decimal(totalSaleAmount), // Set directly
          lastVisitDate: new Date(),
          // Increment totalVisits only if it's the first sale of this visit maybe?
          // Or just update lastVisitDate and let analytics figure out visit count.
          // Keeping simple for now:
          // totalVisits: { increment: 1 }, // Reconsider this logic
        },
      }),

      // 4. Log Staff commission for the sale (e.g., 2% of total)
      prisma.staffCommission.create({
        data: {
          staffId: staffId,
          commissionType: "sale",
          // Prisma expects Decimal
          amountEarned: new Prisma.Decimal(totalSaleAmount * 0.02), // 2% hardcoded
          relatedSaleId: undefined, // Cannot link directly to createMany results easily
          notes: `Comissão de 2% sobre venda de R$ ${totalSaleAmount.toFixed(2)}`,
        }
      })
    ]);

    // Extract the updatedVisit result (it should be the second element)
     // Cast to the expected return type of the update operation
    const updatedVisit = transactionResults[1] as { consumableCreditRemaining: Prisma.Decimal };


    // --- 4b. Calculate and Update Client Average Spend (outside initial transaction for simplicity) ---
    // A more robust solution might use a database trigger or a separate update after the transaction.


    return NextResponse.json<ApiResponse<{ newCredit: number }>>( // Return number
      { success: true, data: { newCredit: Number(updatedVisit.consumableCreditRemaining) } }, // Convert final Decimal back to number
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

