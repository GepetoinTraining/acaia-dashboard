import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Staff, StaffRole } from "@prisma/client";

/**
 * GET /api/staff
 * Fetches all staff members.
 * Only accessible by logged-in staff.
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
    const staff = await prisma.staff.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json<ApiResponse<Staff[]>>(
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
 * Only accessible by logged-in staff (TODO: add role check, e.g., Admin/Cashier only)
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  // TODO: Add check: if (session.staff.role !== StaffRole.Cashier) ...

  try {
    const { name, role, pin } = (await req.json()) as {
      name: string;
      role: StaffRole;
      pin: string;
    };

    if (!name || !role || !pin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Encrypt the PIN
    const hashedPin = await hash(pin, 12);

    const newStaff = await prisma.staff.create({
      data: {
        name,
        defaultRole: role,
        pinCode: hashedPin,
        isActive: true,
      },
    });

    return NextResponse.json<ApiResponse<Staff>>(
      { success: true, data: newStaff },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/staff error:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('pinCode')) {
         return NextResponse.json<ApiResponse>(
           { success: false, error: "Este PIN já está em uso." },
           { status: 409 }
         );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar funcionário" },
      { status: 500 }
    );
  }
}
