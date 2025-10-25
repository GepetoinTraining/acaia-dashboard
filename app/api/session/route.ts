// File: app/api/session/route.ts
import { getSession } from "@/lib/auth";
import { ApiResponse, StaffSession } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/session
 * Returns the current staff session data if logged in.
 */
export async function GET(req: NextRequest) {
    const session = await getSession();

    if (session.staff?.isLoggedIn) {
        // Return only necessary, non-sensitive data
        const sessionData: StaffSession = {
            id: session.staff.id,
            name: session.staff.name,
            role: session.staff.role,
            isLoggedIn: true,
            shiftId: session.staff.shiftId,
            // Exclude PIN even if it exists in the session store
        };
         return NextResponse.json<ApiResponse<StaffSession>>(
             { success: true, data: sessionData },
             { status: 200 }
         );
    } else {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autenticado" },
            { status: 401 }
        );
    }
}