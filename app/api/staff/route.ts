import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { getSession } from "@/lib/auth"; // Adjust path if needed
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
// Import Staff and StaffRole from prisma client for Acaia schema
import { Staff, StaffRole, Prisma } from "@prisma/client";

/**
 * GET /api/staff
 * Fetches all staff members.
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
    // Exclude pincode hash from the response for security
    const staff = await prisma.staff.findMany({
      orderBy: { name: "asc" },
      select: {
          id: true,
          name: true,
          defaultRole: true,
          isActive: true,
          createdAt: true,
          // Explicitly exclude pinCode
      }
    });
    // Cast needed because select changes the type
    return NextResponse.json<ApiResponse<Partial<Staff>[]>>(
      { success: true, data: staff },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar equipe" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff
 * Creates a new staff member.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  // TODO: Add stricter role check (e.g., only Manager/Admin can create staff)
  // if (!session.staff?.isLoggedIn || (session.staff.role !== StaffRole.Manager && session.staff.role !== StaffRole.Admin)) {
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }

  try {
    const { name, role, pin } = (await req.json()) as {
      name: string;
      role: StaffRole; // Use updated StaffRole enum
      pin: string;
    };

    // --- Basic Input Validation ---
    if (!name || !role || !pin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Campos obrigatórios faltando (Nome, Cargo, PIN)" },
        { status: 400 }
      );
    }
    if (name.trim().length < 2) {
         return NextResponse.json<ApiResponse>(
           { success: false, error: "Nome inválido." },
           { status: 400 }
         );
    }
    if (!Object.values(StaffRole).includes(role)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Cargo inválido." },
          { status: 400 }
        );
    }

    // --- Added 6-digit PIN Validation ---
    if (!/^\d{6}$/.test(pin)) {
       return NextResponse.json<ApiResponse>(
         { success: false, error: "PIN inválido. Deve conter exatamente 6 dígitos." },
         { status: 400 }
       );
    }
    // --- End Added Check ---

    // Encrypt the PIN before saving
    const hashedPin = await hash(pin, 12); // Using bcryptjs

    const newStaff = await prisma.staff.create({
      data: {
        name,
        defaultRole: role,
        pinCode: hashedPin, // Store the hashed PIN
        isActive: true, // Default to active
      },
      // Select only non-sensitive fields to return
      select: {
          id: true,
          name: true,
          defaultRole: true,
          isActive: true,
          createdAt: true,
      }
    });

    // Cast needed because select changes the type
    return NextResponse.json<ApiResponse<Partial<Staff>>>(
      { success: true, data: newStaff },
      { status: 201 } // 201 Created status
    );

  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    // Handle potential unique constraint errors (e.g., duplicate name or PIN)
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === 'P2002') {
             // Check which field caused the error
             const target = error.meta?.target as string[] | undefined;
             let field = "campo";
             if (target?.includes('name')) field = "Nome";
             if (target?.includes('pinCode')) field = "PIN";

             return NextResponse.json<ApiResponse>(
                 { success: false, error: `Este ${field} já está em uso.` },
                 { status: 409 } // 409 Conflict status
             );
         }
     }
    // Generic error for other issues
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno ao criar funcionário." },
      { status: 500 }
    );
  }
}

// TODO: Add PATCH /api/staff/[id] for updating staff (role, isActive, pin reset?)
// TODO: Add DELETE /api/staff/[id] for deactivating/removing staff (soft delete recommended)