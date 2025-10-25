// File: app/api/vinyl-records/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { VinylRecord, Prisma, StaffRole } from "@prisma/client"; // Added StaffRole

/**
 * GET /api/vinyl-records
 * Fetches all vinyl records.
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

    try {
        const vinylRecords = await prisma.vinylRecord.findMany({
            orderBy: [{ artist: "asc" }, { title: "asc" }], // Order by artist, then title
        });

        // No Decimal fields to serialize in VinylRecord base model
        return NextResponse.json<ApiResponse<VinylRecord[]>>(
            { success: true, data: vinylRecords },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/vinyl-records error:", error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao buscar discos de vinil" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/vinyl-records
 * Creates a new vinyl record.
 * Requires Admin/Manager role.
 */
export async function POST(req: NextRequest) {
    const session = await getSession();
    // Stricter role check
    if (!session.staff?.isLoggedIn || (session.staff.role !== StaffRole.Admin && session.staff.role !== StaffRole.Manager)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 } // Forbidden
        );
    }

    try {
        const body = await req.json() as {
            artist: string;
            title: string;
            genre?: string | null;
            year?: number | string | null; // Allow string from form input
        };

        const { artist, title, genre, year } = body;
        let inputError: string | null = null; // Variable for validation error

        // --- Validation ---
        if (!artist || artist.trim().length < 1) {
            inputError = "Nome do artista é obrigatório.";
        } else if (!title || title.trim().length < 1) {
            inputError = "Título do disco é obrigatório.";
        }

        // --- FIX: Revised Year Validation ---
        let numYear: number | null = null; // Variable to store validated year
        if (year !== undefined && year !== null && year !== '') { // Only validate if year is provided and not empty
            numYear = parseInt(String(year)); // Attempt parsing
             if (isNaN(numYear) || numYear < 1000 || numYear > new Date().getFullYear() + 1) {
                 inputError = "Ano inválido (ex: 1995).";
             }
        }
        // --- End Fix ---

        // Return error if any validation failed
        if (inputError) {
             return NextResponse.json<ApiResponse>({ success: false, error: inputError }, { status: 400 });
        }
        // --- End Validation ---


        const newVinylRecord = await prisma.vinylRecord.create({
            data: {
                artist: artist.trim(),
                title: title.trim(),
                genre: genre?.trim() || null,
                year: numYear, // Use the validated numYear (can be number or null)
            },
        });

        return NextResponse.json<ApiResponse<VinylRecord>>(
            { success: true, data: newVinylRecord },
            { status: 201 } // 201 Created
        );

    } catch (error: any) {
        console.error("POST /api/vinyl-records error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             const target = error.meta?.target;
             const isCompositeKeyError = Array.isArray(target) && target.includes('artist') && target.includes('title');

             if (isCompositeKeyError) {
                 return NextResponse.json<ApiResponse>(
                     { success: false, error: "Já existe um disco com este artista e título." },
                     { status: 409 } // Conflict
                 );
             }
         }
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao adicionar disco de vinil." },
            { status: 500 }
        );
    }
}