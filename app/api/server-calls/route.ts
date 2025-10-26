// PATH: app/api/server-calls/route.ts
// NOTE: This is a NEW FILE.

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { ServerCallStatus } from "@prisma/client";

/**
 * POST /api/server-calls
 * Creates a new server call from a client at a specific location.
 * The client provides the qrCodeId of their location.
 */
export async function POST(req: NextRequest) {
  try {
    const { qrCodeId } = await req.json();

    if (!qrCodeId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "QR Code ID é obrigatório" },
        { status: 400 }
      );
    }

    // --- 1. Find the VenueObject by its QR Code ID ---
    const venueObject = await prisma.venueObject.findUnique({
      where: { qrCodeId: qrCodeId },
    });

    if (!venueObject) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Localização (QR Code) inválida" },
        { status: 404 }
      );
    }

    // --- 2. Find the *active* Visit at that VenueObject ---
    // An active visit means it has no checkOutAt timestamp.
    const activeVisit = await prisma.visit.findFirst({
      where: {
        venueObjectId: venueObject.id,
        checkOutAt: null,
      },
    });

    if (!activeVisit) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error:
            "Nenhuma visita ativa encontrada para esta localização. Faça o check-in no QR Code.",
        },
        { status: 404 }
      );
    }

    // --- 3. Check for existing PENDING calls for this visit ---
    const existingCall = await prisma.serverCall.findFirst({
      where: {
        visitId: activeVisit.id,
        status: ServerCallStatus.PENDING,
      },
    });

    if (existingCall) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Você já possui uma chamada pendente. Aguarde.",
        },
        { status: 409 } // Conflict
      );
    }

    // --- 4. Create the new ServerCall ---
    const newServerCall = await prisma.serverCall.create({
      data: {
        visitId: activeVisit.id,
        venueObjectId: venueObject.id,
        status: ServerCallStatus.PENDING,
      },
    });

    return NextResponse.json<ApiResponse<any>>(
      { success: true, data: newServerCall },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Server call error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}