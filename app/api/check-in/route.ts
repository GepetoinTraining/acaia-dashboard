// File: app/api/check-in/route.ts
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { NextRequest, NextResponse } from "next/server";
import { Prisma, ClientStatus } from "@prisma/client";

// Define the expected request body (optional name/phone for future use)
interface CheckInPayload {
    name?: string | null;
    phoneNumber?: string | null;
    // We might need a way to pass the entry fee paid, or fetch it server-side
    entryFeePaid?: number | string | null;
}

// Default CRM data for anonymous check-ins
const defaultCrmData = { /* ... your default CRM structure ... */ };

/**
 * POST /api/check-in
 * Creates a new (potentially anonymous) client and starts their visit.
 * Triggered by the client scanning an entry QR code and confirming on the check-in page.
 */
export async function POST(req: NextRequest) {
  try {
    const body: CheckInPayload = await req.json();
    const { name, phoneNumber, entryFeePaid } = body;

    // --- 1. Create the Client record ---
    // Use provided name or default to "Patrono" + timestamp/random for anonymity
    const clientName = (name && name.trim().length > 1) ? name.trim() : `Patrono #${Date.now().toString().slice(-6)}`; // Simple unique-ish anonymous name

    // Prepare client data
    const clientCreateData: Prisma.ClientCreateInput = {
      name: clientName,
      phoneNumber: (phoneNumber && phoneNumber.trim()) ? phoneNumber.trim() : null,
      status: ClientStatus.new, // Default status
      crmData: defaultCrmData, // Use default CRM structure
      // acquiredByStaffId: null // Not tracked in this flow
    };

    // Use findOrCreate logic if phone number is provided and unique constraint exists
    let client;
    if (clientCreateData.phoneNumber) {
        client = await prisma.client.upsert({
            where: { phoneNumber: clientCreateData.phoneNumber },
            update: {
                // Optionally update name if provided again? Or just use existing.
                // name: clientCreateData.name // Be careful with overwriting names
            },
            create: clientCreateData
        });
    } else {
        // If no phone number, always create a new client
        client = await prisma.client.create({
            data: clientCreateData
        });
    }


    // --- 2. Create the Visit record ---
    // Determine entry fee - hardcode for MVP, fetch dynamically later
    const fee = (entryFeePaid !== undefined && entryFeePaid !== null)
                  ? parseFloat(String(entryFeePaid))
                  : 50.00; // Hardcoded default entry fee for MVP

    if (isNaN(fee) || fee < 0) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Valor de taxa de entrada inválido" },
          { status: 400 }
        );
    }

    const newVisit = await prisma.visit.create({
      data: {
        clientId: client.id, // Link to the created/found client
        entryFeePaid: new Prisma.Decimal(fee),
        // For Acaia, consumable credit might not apply, default to 0
        consumableCreditTotal: new Prisma.Decimal(0),
        consumableCreditRemaining: new Prisma.Decimal(0),
        // seatingAreaId will be set when they scan a table QR
      },
      select: { // Select only necessary fields to return
          id: true,
          entryTime: true,
          clientId: true,
          client: { select: { name: true } } // Include client name for confirmation
      }
    });

    // --- 3. Return Confirmation ---
    // We return minimal info, just confirming the visit started.
    // The client doesn't get a token here; they use table QRs next.
    return NextResponse.json<ApiResponse<{ visitId: number; message: string; clientName: string | null }>>(
      {
          success: true,
          data: {
              visitId: newVisit.id,
              clientName: newVisit.client?.name ?? null, // Send back the name used
              message: "Check-in realizado com sucesso! Escaneie o QR code da sua mesa para ver o menu."
          }
      },
      { status: 201 } // 201 Created
    );

  } catch (error: any) {
    console.error("POST /api/check-in error:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target?.includes('phoneNumber')) {
        // Handle unique phone number violation specifically during create (if upsert somehow failed)
         return NextResponse.json<ApiResponse>(
             { success: false, error: "Este número de telefone já está registrado." },
             { status: 409 } // Conflict
         );
     }
    // Generic server error
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor durante o check-in." },
      { status: 500 }
    );
  }
}