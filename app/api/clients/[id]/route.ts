import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, ClientDetails } from "@/lib/types"; // Import ClientDetails
import { NextRequest, NextResponse } from "next/server";
import { Client, Prisma, ClientStatus } from "@prisma/client";

type GetParams = {
  params: { id: string };
};

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
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        // Include visits...
        visits: {
          orderBy: { entryTime: 'desc' }, // Order visits, newest first
          // ...and within each visit, include sales...
          include: {
            sales: {
              orderBy: { createdAt: 'asc' }, // Order sales within a visit
              // ...and within each sale, include product and host
              include: {
                product: true,
                host: true, // Make sure host relation exists in Sale model
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

    // Although the Prisma query matches ClientDetails structure,
    // explicit casting can sometimes help TypeScript.
    // We also need to handle potential Decimal to number/string conversion if necessary for the client,
    // but ClientDetails in lib/types.ts uses Decimal, so direct return should be okay.
    return NextResponse.json<ApiResponse<ClientDetails>>(
      // Cast the result to ClientDetails to satisfy the response type
      { success: true, data: client as unknown as ClientDetails },
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
export async function PATCH(req: NextRequest, { params }: GetParams) { // Changed PatchParams to GetParams reuse
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  // TODO: Add role check

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "ID de cliente inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    // Allow updating more fields if needed
    // Assuming acquiredByStaffId comes as string | null from JSON
    const { crmData, name, phoneNumber, status, acquiredByStaffId } = body as {
        crmData?: any;
        name?: string;
        phoneNumber?: string | null;
        status?: ClientStatus; // Make sure ClientStatus is imported if not already
        acquiredByStaffId?: string | null;
    };


    // Build update data object conditionally
    const updateData: Prisma.ClientUpdateInput = {};
    if (crmData && typeof crmData === 'object') updateData.crmData = crmData;
    if (name !== undefined) updateData.name = name;
    // Allow setting phone number to null
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (status !== undefined) updateData.status = status;

    // Handle acquiredByStaffId update using connect/disconnect
    if (acquiredByStaffId !== undefined) {
      if (acquiredByStaffId === null) {
        // If the ID is explicitly null, disconnect the relation
        updateData.acquiredByStaff = {
          disconnect: true,
        };
      } else {
        // If the ID is provided (as a string from JSON), connect to that staff ID
        // Ensure parsing is safe
        const staffIdNumber = parseInt(acquiredByStaffId);
        if (!isNaN(staffIdNumber)) {
             updateData.acquiredByStaff = {
               connect: { id: staffIdNumber },
             };
        } else {
            // Handle case where acquiredByStaffId is present but not a valid number string
             return NextResponse.json<ApiResponse>(
                { success: false, error: "ID de staff inválido fornecido para acquiredByStaffId" },
                { status: 400 }
            );
        }
      }
    }


    if (Object.keys(updateData).length === 0) {
       return NextResponse.json<ApiResponse>(
        { success: false, error: "Nenhum dado válido para atualizar" },
        { status: 400 }
      );
    }

    // ... rest of existing code ...
  } catch (error: any) {
    // ... existing error handling ...
  }
}

