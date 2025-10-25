import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { getSession, sessionOptions } from "@/lib/auth";
import { StaffSession, ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth
 * Handles Staff login by PIN
 */
export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "PIN é obrigatório" },
        { status: 400 }
      );
    }

    // Find all staff (in a real app, optimize this, but for PINs it's tricky)
    // This is not performant, but PINs aren't unique.
    // A better way: require PIN + Name, or make PINs unique.
    // For this model, we'll assume PINs are NOT unique and find all matches.
    
    // Let's change the logic: We'll find the *first* active staff member
    // whose PIN matches. `pinCode` field in schema is unique.
    
    const staffList = await prisma.staff.findMany({ where: { isActive: true } });
    let authenticatedStaff = null;

    for (const staff of staffList) {
      if (staff.pinCode && (await compare(pin, staff.pinCode))) {
        authenticatedStaff = staff;
        break;
      }
    }

    if (!authenticatedStaff) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "PIN inválido ou staff inativo" },
        { status: 401 }
      );
    }

    // --- Login successful ---
    const session = await getSession();

    // Save user data in the session
    session.staff = {
      id: authenticatedStaff.id,
      name: authenticatedStaff.name,
      role: authenticatedStaff.defaultRole,
      isLoggedIn: true,
    };
    await session.save();

    return NextResponse.json<ApiResponse<StaffSession>>(
      { success: true, data: session.staff },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth
 * Handles Staff logout
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    session.destroy(); // Clear the session cookie

    // Also tell Next.js to clear its cache of the cookie
    cookies().delete(sessionOptions.cookieName);

    return NextResponse.json<ApiResponse>(
      { success: true, data: "Logout successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
