// File: app/api/entertainers/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Entertainer, Prisma } from "@prisma/client";

/**
 * GET /api/entertainers
 * Fetches all entertainers (can filter by active status).
 * Requires staff login.
 */
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session.staff?.isLoggedIn) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    try {
        const entertainers = await prisma.entertainer.findMany({
            where: includeInactive ? {} : { isActive: true }, // Filter if not including inactive
            orderBy: { name: "asc" },
        });

        return NextResponse.json<ApiResponse<Entertainer[]>>(
            { success: true, data: entertainers },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/entertainers error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao buscar artistas" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/entertainers
 * Creates a new entertainer.
 * Requires Admin/Manager role (TODO: Implement stricter role check).
 */
export async function POST(req: NextRequest) {
    const session = await getSession();
    // TODO: Add stricter role check (Manager/Admin)
    if (!session.staff?.isLoggedIn || session.staff.role !== 'Admin' && session.staff.role !== 'Manager') {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 } // Forbidden
        );
    }

    try {
        const body = await req.json() as {
            name: string;
            type: string;
            contactNotes?: string | null;
            // isActive defaults to true in schema
        };

        const { name, type, contactNotes } = body;

        // --- Validation ---
        if (!name || name.trim().length < 1) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Nome do artista é obrigatório." },
                { status: 400 }
            );
        }
        if (!type || type.trim().length < 1) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Tipo do artista é obrigatório." },
                { status: 400 }
            );
        }
        // --- End Validation ---

        const newEntertainer = await prisma.entertainer.create({
            data: {
                name: name.trim(),
                type: type.trim(),
                contactNotes: contactNotes || null,
                isActive: true, // Explicitly set default
            },
        });

        return NextResponse.json<ApiResponse<Entertainer>>(
            { success: true, data: newEntertainer },
            { status: 201 } // 201 Created
        );

    } catch (error: any) {
        console.error("POST /api/entertainers error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && error.meta?.target?.includes('name')) {
             // Assuming name should be unique based on schema/usage pattern
             return NextResponse.json<ApiResponse>(
                 { success: false, error: "Já existe um artista com este nome." },
                 { status: 409 } // Conflict
             );
         }
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao criar artista." },
            { status: 500 }
        );
    }
}