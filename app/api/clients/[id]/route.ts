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
        visits: {
          orderBy: { entryTime: 'desc' },
          include: {
             seatingArea: true,
             sales: {
                orderBy: { createdAt: 'asc' },
                include: {
                  product: true,
                  staff: {
                      select: { name: true }
                  }
                },
             },
          },
        },
        _count: {
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
                product: sale.product ? {
                    ...sale.product,
                    costPrice: Number(sale.product.costPrice),
                    salePrice: Number(sale.product.salePrice),
                    deductionAmountInSmallestUnit: Number(sale.product.deductionAmountInSmallestUnit),
                } : null,
                // staff is already serialized correctly
            })),
        })),
     };
    // --- End Serialization ---

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

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "ID de cliente inválido" },
      { status: 400 }
    );
  }

  // Define updateData outside try block to use in catch
  let updateData: Prisma.ClientUpdateInput = {};

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
    // updateData = {}; // Reset inside try
    if (crmData !== undefined && typeof crmData === 'object') updateData.crmData = crmData;
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (status !== undefined) {
         if (!Object.values(ClientStatus).includes(status)) {
             return NextResponse.json<ApiResponse>({ success: false, error: "Status inválido fornecido" }, { status: 400 });
         }
         updateData.status = status;
    }
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

      const serializedClient = {
          ...updatedClient,
          avgSpendPerVisit: Number(updatedClient.avgSpendPerVisit),
          lifetimeSpend: Number(updatedClient.lifetimeSpend),
      };

     return NextResponse.json<ApiResponse<Client>>(
         { success: true, data: serializedClient as any },
         { status: 200 }
     );

  } catch (error: any) {
     console.error(`PATCH /api/clients/${id} error:`, error);
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2002') {
             // --- FIX STARTS HERE ---
             const target = error.meta?.target;
             const isPhoneNumberError = Array.isArray(target) && target.includes('phoneNumber');
             // --- FIX ENDS HERE ---

             // Check if the error is for the phone number *and* if we were trying to update the phone number
             if (isPhoneNumberError && updateData.phoneNumber !== undefined) {
                  return NextResponse.json<ApiResponse>({ success: false, error: "Este número de telefone já está em uso por outro cliente." }, { status: 409 });
             }
             // Handle other unique constraint errors if necessary
         }
         if (error.code === 'P2025') {
              return NextResponse.json<ApiResponse>({ success: false, error: "Cliente não encontrado." }, { status: 404 });
         }
     }
    return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}