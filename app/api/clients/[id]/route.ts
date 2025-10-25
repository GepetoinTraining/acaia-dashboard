// File: app/api/clients/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, ClientDetails } from "@/lib/types"; // Import ClientDetails
import { NextRequest, NextResponse } from "next/server";
import { Client, Prisma, ClientStatus, Sale, Product } from "@prisma/client"; // Added Sale, Product for explicit typing

type GetParams = {
  params: { id: string };
};

// Define a more specific type for the data returned by the query
// This helps ensure type safety and clarity
type ClientQueryResult = Prisma.ClientGetPayload<{
    include: {
        visits: {
            orderBy: { entryTime: 'desc' },
            include: {
                seatingArea: true, // Include SeatingArea
                sales: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        product: true,
                        staff: { // Include staff who made the sale instead of host
                            select: { name: true } // Only select name
                        }
                        // host: true, // REMOVED THIS LINE
                    },
                },
            },
        },
        _count: {
            select: { visits: true }
        }
    }
}>;


/**
 * GET /api/clients/[id]
 * Fetches detailed information for a single client, including visits and sales.
 */
export async function GET(req: NextRequest, { params }: GetParams) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "ID de cliente inválido" },
      { status: 400 }
    );
  }

  try {
    const client: ClientQueryResult | null = await prisma.client.findUnique({
      where: { id },
      include: {
        // Include visits...
        visits: {
          orderBy: { entryTime: 'desc' }, // Order visits, newest first
          // ...and within each visit, include sales...
          include: {
             seatingArea: true, // Include SeatingArea
             sales: {
                orderBy: { createdAt: 'asc' }, // Order sales within a visit
                // ...and within each sale, include product and staff
                include: {
                  product: true,
                  staff: { // Include staff instead of host
                      select: { name: true } // Only select necessary fields
                  }
                  // host: true, // --- THIS LINE WAS REMOVED ---
                },
             },
          },
        },
        _count: { // Also get the total visit count efficiently
          select: { visits: true }
        }
      },
    });

    if (!client) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // --- Serialize Decimal fields before sending ---
     const serializedClient = {
        ...client,
        avgSpendPerVisit: Number(client.avgSpendPerVisit),
        lifetimeSpend: Number(client.lifetimeSpend),
        visits: client.visits.map(visit => ({
            ...visit,
            entryFeePaid: Number(visit.entryFeePaid),
            consumableCreditTotal: Number(visit.consumableCreditTotal),
            consumableCreditRemaining: Number(visit.consumableCreditRemaining),
            seatingArea: visit.seatingArea ? {
                ...visit.seatingArea,
                reservationCost: Number(visit.seatingArea.reservationCost),
            } : null,
            sales: visit.sales.map(sale => ({
                ...sale,
                priceAtSale: Number(sale.priceAtSale),
                totalAmount: Number(sale.totalAmount),
                // staff relation is already just { name: string | null } which is serializable
                product: sale.product ? { // Check if product exists before serializing
                    ...sale.product,
                    costPrice: Number(sale.product.costPrice),
                    salePrice: Number(sale.product.salePrice),
                    deductionAmountInSmallestUnit: Number(sale.product.deductionAmountInSmallestUnit),
                } : null,
            })),
        })),
     };
    // --- End Serialization ---


    // Cast the serialized result to ClientDetails to satisfy the response type
    // Use 'as any' or a more specific serialized type if ClientDetails still expects Decimals
    return NextResponse.json<ApiResponse<ClientDetails>>(
      { success: true, data: serializedClient as any },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`GET /api/clients/${id} error:`, error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar detalhes do cliente" },
      { status: 500 }
    );
  }
}


/**
 * PATCH /api/clients/[id]
 * Updates a client's details (e.g., their crmData).
 */
export async function PATCH(req: NextRequest, { params }: GetParams) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  // TODO: Add role check if needed (e.g., only Manager/Admin can change status?)

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "ID de cliente inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { crmData, name, phoneNumber, status, acquiredByStaffId } = body as {
        crmData?: any;
        name?: string;
        phoneNumber?: string | null;
        status?: ClientStatus;
        acquiredByStaffId?: string | null;
    };


    // Build update data object conditionally
    const updateData: Prisma.ClientUpdateInput = {};
    if (crmData !== undefined && typeof crmData === 'object') updateData.crmData = crmData; // Allow null/empty object
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber; // Allow setting phone number to null
    if (status !== undefined) {
         if (!Object.values(ClientStatus).includes(status)) {
             return NextResponse.json<ApiResponse>({ success: false, error: "Status inválido fornecido" }, { status: 400 });
         }
         updateData.status = status;
    }

    // Handle acquiredByStaffId update using connect/disconnect
    if (acquiredByStaffId !== undefined) {
      if (acquiredByStaffId === null) {
        updateData.acquiredByStaff = { disconnect: true };
      } else {
        const staffIdNumber = parseInt(acquiredByStaffId);
        if (!isNaN(staffIdNumber)) {
             updateData.acquiredByStaff = { connect: { id: staffIdNumber } };
        } else {
             return NextResponse.json<ApiResponse>({ success: false, error: "ID de staff inválido fornecido para acquiredByStaffId" }, { status: 400 });
        }
      }
    }


    if (Object.keys(updateData).length === 0) {
       return NextResponse.json<ApiResponse>(
        { success: false, error: "Nenhum dado válido para atualizar" },
        { status: 400 }
      );
    }

     const updatedClient = await prisma.client.update({
         where: { id },
         data: updateData,
     });

      // --- Serialize Decimal fields before returning ---
      const serializedClient = {
          ...updatedClient,
          avgSpendPerVisit: Number(updatedClient.avgSpendPerVisit),
          lifetimeSpend: Number(updatedClient.lifetimeSpend),
      };
     // --- End Serialization ---


     // Return the updated client data (excluding sensitive/large fields like crmData if desired)
     // Cast needed due to serialization
     return NextResponse.json<ApiResponse<Client>>(
         { success: true, data: serializedClient as any },
         { status: 200 }
     );

  } catch (error: any) {
     console.error(`PATCH /api/clients/${id} error:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2002' && error.meta?.target?.includes('phoneNumber') && updateData.phoneNumber) {
              return NextResponse.json<ApiResponse>({ success: false, error: "Este número de telefone já está em uso por outro cliente." }, { status: 409 });
         }
         if (error.code === 'P2025') { // Record to update not found
              return NextResponse.json<ApiResponse>({ success: false, error: "Cliente não encontrado." }, { status: 404 });
         }
     }
    return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}