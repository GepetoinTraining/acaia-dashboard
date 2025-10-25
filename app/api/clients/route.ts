import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
// Import Client and ClientStatus from prisma/client
import { Client, ClientStatus, Prisma } from "@prisma/client";

/**
 * GET /api/clients
 * Fetches all clients for the main client list.
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
    const clients = await prisma.client.findMany({
      orderBy: {
        // Order by lastVisitDate descending (nulls last), then createdAt descending
        lastVisitDate: { sort: 'desc', nulls: 'last' },
        createdAt: "desc",
      },
      // Select specific fields for the table to potentially reduce payload
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true,
        avgSpendPerVisit: true,
        lifetimeSpend: true,
        totalVisits: true,
        lastVisitDate: true,
        // Exclude crmData unless needed for the table view
      }
    });

     // Convert Decimal fields to numbers/strings for JSON safety
     const serializedClients = clients.map(client => ({
        ...client,
        avgSpendPerVisit: client.avgSpendPerVisit ? Number(client.avgSpendPerVisit) : 0,
        lifetimeSpend: client.lifetimeSpend ? Number(client.lifetimeSpend) : 0,
     }));

    return NextResponse.json<ApiResponse<Client[]>>(
      // Cast as any because serialization changes Decimal->number
      { success: true, data: serializedClients as any },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/clients error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Creates a new client.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  // TODO: Add role check if necessary

  try {
    // Explicitly type the expected body structure
    const body = await req.json() as {
        name: string;
        phoneNumber?: string | null;
        status?: ClientStatus; // Use the imported enum
        acquiredByStaffId?: string | null; // Expect string from JSON
        crmData?: any;
    };

    const { name, phoneNumber, status, acquiredByStaffId, crmData } = body;

    if (!name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Validate status against the enum values if provided
    if (status && !Object.values(ClientStatus).includes(status)) {
       return NextResponse.json<ApiResponse>(
        { success: false, error: "Status inválido fornecido" },
        { status: 400 }
      );
    }

    // Prepare data for Prisma create
    const createData: Prisma.ClientCreateInput = {
        name,
        phoneNumber: phoneNumber || null,
        // Use the validated status, default to 'new' if not provided
        status: status || ClientStatus.new,
        crmData: crmData || Prisma.JsonNull, // Use Prisma.JsonNull for empty JSON
    };

    // Handle connecting the acquiredByStaff relation
    if (acquiredByStaffId) {
        const staffIdNumber = parseInt(acquiredByStaffId);
        if (!isNaN(staffIdNumber)) {
            createData.acquiredByStaff = {
                connect: { id: staffIdNumber }
            };
        } else {
             return NextResponse.json<ApiResponse>(
                { success: false, error: "ID de staff inválido fornecido para acquiredByStaffId" },
                { status: 400 }
            );
        }
    }


    const newClient = await prisma.client.create({
      data: createData,
    });

    // Return only essential data, no need to return full crmData on create
    const { crmData: _, ...clientData } = newClient;

    return NextResponse.json<ApiResponse<Omit<Client, 'crmData'>>>(
      { success: true, data: clientData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/clients error:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
       // Handle unique constraint violation (e.g., phone number)
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Falha na restrição única: ${error.meta?.target}` },
          { status: 409 } // Conflict
        );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
