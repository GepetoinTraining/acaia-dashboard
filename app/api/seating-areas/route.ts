// File: app/api/seating-areas/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { SeatingArea, SeatingAreaType, Prisma } from "@prisma/client"; // Import Prisma for types
import { randomBytes } from "crypto"; // For generating tokens

// Helper to generate a unique token (can be moved to a util file)
function generateUniqueToken(length = 10) {
  return randomBytes(length).toString('hex');
}

/**
 * GET /api/seating-areas
 * Fetches all active seating areas, potentially with current visit status.
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
    const areas = await prisma.seatingArea.findMany({
      where: {
        isActive: true, // Typically fetch only active ones for selection
      },
      include: {
        visits: {
          where: { exitTime: null },
          select: {
            id: true,
            clientId: true,
            client: { select: { name: true } }
          },
          orderBy: { entryTime: 'desc' },
          take: 1,
        }
      },
      orderBy: { name: "asc" },
    });

    // Define the type explicitly based on the include
     type SeatingAreaWithVisitInfo = SeatingArea & {
         visits: {
             id: number;
             clientId: number | null;
             client: { name: string | null; } | null;
         }[];
     };


    // Cast the result to satisfy the generic ApiResponse type
    return NextResponse.json<ApiResponse<SeatingAreaWithVisitInfo[]>>(
      { success: true, data: areas as SeatingAreaWithVisitInfo[] },
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
 * Requires Admin/Manager role (TODO: Implement role check)
 */
export async function POST(req: NextRequest) {
    const session = await getSession();
    // TODO: Add stricter role check (Manager/Admin)
    if (!session.staff?.isLoggedIn) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado" },
            { status: 401 }
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
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Nome da área é obrigatório." },
                { status: 400 }
            );
        }
         if (!type || !Object.values(SeatingAreaType).includes(type)) {
             return NextResponse.json<ApiResponse>(
                 { success: false, error: "Tipo de área inválido." },
                 { status: 400 }
             );
         }
         const numCapacity = capacity ? parseInt(String(capacity)) : null;
         if (numCapacity !== null && (isNaN(numCapacity) || numCapacity < 0)) {
              return NextResponse.json<ApiResponse>(
                  { success: false, error: "Capacidade inválida." },
                  { status: 400 }
              );
         }
         const numCost = reservationCost ? parseFloat(String(reservationCost)) : 0;
          if (isNaN(numCost) || numCost < 0) {
              return NextResponse.json<ApiResponse>(
                  { success: false, error: "Custo de reserva inválido." },
                  { status: 400 }
              );
         }
        // --- End Validation ---

        // Generate a unique QR token
        const qrCodeToken = generateUniqueToken();

        const newArea = await prisma.seatingArea.create({
            data: {
                name: name.trim(),
                capacity: numCapacity,
                type: type,
                reservationCost: new Prisma.Decimal(numCost),
                qrCodeToken: qrCodeToken, // Assign generated token
                isActive: true, // Default to active
            },
        });

        return NextResponse.json<ApiResponse<SeatingArea>>(
            { success: true, data: newArea },
            { status: 201 } // 201 Created
        );

    } catch (error: any) {
        console.error("POST /api/seating-areas error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target?.includes('name')) {
             return NextResponse.json<ApiResponse>(
                 { success: false, error: "Já existe uma área com este nome." },
                 { status: 409 } // Conflict
             );
         }
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao criar área de assento." },
            { status: 500 }
        );
    }
}
