// File: app/api/seating-areas/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse, SeatingAreaWithVisitInfo } from "@/lib/types"; // Updated import
import { NextRequest, NextResponse } from "next/server";
import { SeatingArea, SeatingAreaType, Prisma, Role } from "@prisma/client"; // Added Role
import { randomBytes } from "crypto";

// Helper to generate a unique token
function generateUniqueToken(length = 10) {
  return randomBytes(length).toString('hex');
}

/**
 * GET /api/seating-areas
 * Fetches seating areas, potentially with current visit status.
 * Accepts ?includeInactive=true query parameter.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.user?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const areas = await prisma.seatingArea.findMany({
      where: includeInactive ? {} : { isActive: true }, // Filter if not including inactive
      include: {
        visits: {
          where: { exitTime: null }, // Only include *active* visits
          select: {
            id: true,
            clientId: true,
            client: { select: { name: true } } // Select client name
          },
          orderBy: { entryTime: 'desc' }, // Get the most recent active visit if multiple (shouldn't happen)
          take: 1, // Only need one to know if occupied
        }
      },
      orderBy: { name: "asc" },
    });

    // Serialize Decimal fields to numbers/strings before sending JSON
    const serializedAreas = areas.map(area => ({
        ...area,
        reservationCost: Number(area.reservationCost), // Convert Decimal to number
        // Visits array is already serializable
    }));


    // Use the imported SeatingAreaWithVisitInfo type for the response
    return NextResponse.json<ApiResponse<SeatingAreaWithVisitInfo[]>>(
      // Cast the serialized data
      { success: true, data: serializedAreas as any }, // 'as any' due to Decimal -> number conversion
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/seating-areas error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar áreas de assento" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seating-areas
 * Creates a new seating area.
 * Requires Admin/Manager role.
 */
export async function POST(req: NextRequest) {
    const session = await getSession();
    // Stricter role check
    if (!session.user?.isLoggedIn || (session.user.role !== Role.Admin && session.user.role !== Role.Manager)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { name, capacity, type, reservationCost } = body as {
            name: string;
            capacity?: number | string | null;
            type: SeatingAreaType;
            reservationCost?: number | string | null;
        };

        // --- Validation ---
        if (!name || name.trim().length < 1) {
            return NextResponse.json<ApiResponse>({ success: false, error: "Nome da área é obrigatório." }, { status: 400 });
        }
         if (!type || !Object.values(SeatingAreaType).includes(type)) {
             return NextResponse.json<ApiResponse>({ success: false, error: "Tipo de área inválido." }, { status: 400 });
         }
         const numCapacity = capacity ? parseInt(String(capacity)) : null;
         if (numCapacity !== null && (isNaN(numCapacity) || numCapacity < 0)) {
              return NextResponse.json<ApiResponse>({ success: false, error: "Capacidade inválida." }, { status: 400 });
         }
         const numCost = reservationCost ? parseFloat(String(reservationCost)) : 0;
          if (isNaN(numCost) || numCost < 0) {
              return NextResponse.json<ApiResponse>({ success: false, error: "Custo de reserva inválido." }, { status: 400 });
         }
        // --- End Validation ---

        const qrCodeToken = generateUniqueToken();

        const newArea = await prisma.seatingArea.create({
            data: {
                name: name.trim(),
                capacity: numCapacity,
                type: type,
                reservationCost: numCost, // Pass number to Decimal field
                qrCodeToken: qrCodeToken,
                isActive: true,
            },
        });

         // Serialize Decimal before returning
        const serializedArea = {
            ...newArea,
            reservationCost: Number(newArea.reservationCost),
        };

        return NextResponse.json<ApiResponse<SeatingArea>>(
            { success: true, data: serializedArea as any }, // Cast needed
            { status: 201 }
        );

    } catch (error: any) {
        console.error("POST /api/seating-areas error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             // --- FIX STARTS HERE ---
             const target = error.meta?.target;
             const isNameError = Array.isArray(target) && target.includes('name');
             const isTokenError = Array.isArray(target) && target.includes('qrCodeToken');
             // --- FIX ENDS HERE ---

             if (isNameError) {
                 return NextResponse.json<ApiResponse>({ success: false, error: "Já existe uma área com este nome." }, { status: 409 });
             }
             if (isTokenError) {
                 // Highly unlikely, but handle token collision just in case
                 return NextResponse.json<ApiResponse>({ success: false, error: "Falha ao gerar token QR único. Tente novamente." }, { status: 500 });
             }
             // Handle other P2002 errors if necessary
         }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao criar área de assento." }, { status: 500 });
    }
}