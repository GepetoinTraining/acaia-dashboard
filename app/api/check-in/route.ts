// File: app/api/check-in/route.ts
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { NextRequest, NextResponse } from "next/server";
import { Prisma, ClientStatus, Visit, Client, SeatingArea } from "@prisma/client"; // Added Visit, Client, SeatingArea

// Define the expected request body
interface CheckInPayload {
    name?: string | null;
    phoneNumber?: string | null;
    entryFeePaid?: number | string | null;
}

// Default CRM data for anonymous check-ins
const defaultCrmData = Prisma.JsonNull;

// Define the type for Visit including potential relations we use
type VisitWithRelations = Visit & {
    client: Client | null;
    seatingArea?: SeatingArea | null; // Optional if not always included
};


/**
 * POST /api/check-in
 * Creates a new (potentially anonymous) client and starts their visit.
 */
export async function POST(req: NextRequest) {
  try {
    const body: CheckInPayload = await req.json();
    const { name, phoneNumber, entryFeePaid } = body;

    // --- 1. Create or Find Client ---
    const clientName = (name && name.trim().length > 1) ? name.trim() : `Patrono #${Date.now().toString().slice(-6)}`;
    const clientCreateData: Prisma.ClientCreateInput = {
      name: clientName,
      phoneNumber: (phoneNumber && phoneNumber.trim()) ? phoneNumber.trim() : null,
      status: ClientStatus.new,
      crmData: defaultCrmData,
    };

    let client: Client;
    if (clientCreateData.phoneNumber) {
        client = await prisma.client.upsert({
            where: { phoneNumber: clientCreateData.phoneNumber },
            update: {},
            create: clientCreateData
        });
    } else {
        client = await prisma.client.create({
            data: clientCreateData
        });
    }

    // --- 2. Create the Visit record ---
    const fee = (entryFeePaid !== undefined && entryFeePaid !== null)
                  ? parseFloat(String(entryFeePaid))
                  : 50.00; // Hardcoded default

    if (isNaN(fee) || fee < 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Valor de taxa de entrada inválido" },
          { status: 400 }
        );
    }

    // --- FIX: Use a temporary variable for creation result ---
    const createdVisit = await prisma.visit.create({
      data: {
        clientId: client.id,
        entryFeePaid: fee, // Pass number, Prisma handles Decimal
        consumableCreditTotal: 0,
        consumableCreditRemaining: 0,
        // seatingAreaId will be set when they scan a table QR
      },
      // Select minimal fields, we re-fetch with relations next
      select: {
          id: true,
          entryTime: true,
          clientId: true,
      }
    });

    // --- FIX: Re-fetch the visit WITH the client relation to ensure correct type ---
    const newVisitWithClient = await prisma.visit.findUnique({
        where: { id: createdVisit.id },
        select: { // Select only necessary fields to return + client name
            id: true,
            entryTime: true,
            clientId: true,
            client: { select: { name: true } } // Include client name for confirmation
        }
    });

    if (!newVisitWithClient) {
        // This should realistically not happen if create succeeded
        throw new Error("Falha ao buscar a visita recém-criada.");
    }
    // --- End Fix ---


    // --- 3. Return Confirmation ---
    return NextResponse.json<ApiResponse<{ visitId: number; message: string; clientName: string | null }>>(
      {
          success: true,
          data: {
              visitId: newVisitWithClient.id,
              // Use the client name fetched in the second query
              clientName: newVisitWithClient.client?.name ?? null,
              message: "Check-in realizado com sucesso! Escaneie o QR code da sua mesa para ver o menu."
          }
      },
      { status: 201 } // 201 Created
    );

  } catch (error: any) {
    console.error("POST /api/check-in error:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target;
        const isPhoneNumberError = Array.isArray(target) && target.includes('phoneNumber');

        if (isPhoneNumberError) {
             return NextResponse.json<ApiResponse>(
                 { success: false, error: "Este número de telefone já está registrado." },
                 { status: 409 } // Conflict
             );
        }
     }
    // Generic server error
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor durante o check-in." },
      { status: 500 }
    );
  }
}