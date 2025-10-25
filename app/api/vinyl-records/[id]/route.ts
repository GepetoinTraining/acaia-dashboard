// File: app/api/vinyl-records/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { VinylRecord, Prisma, StaffRole } from "@prisma/client"; // Added StaffRole

type RouteParams = {
    params: { id: string };
};

/**
 * PATCH /api/vinyl-records/[id]
 * Updates an existing vinyl record.
 * Requires Admin/Manager role.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
    if (!session.staff?.isLoggedIn || (session.staff.role !== StaffRole.Admin && session.staff.role !== StaffRole.Manager)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 }
        );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json<ApiResponse>({ success: false, error: "ID de disco inválido" }, { status: 400 });
    }

    let updateData: Prisma.VinylRecordUpdateInput = {};

    try {
        const body = await req.json() as {
            artist?: string;
            title?: string;
            genre?: string | null;
            year?: number | string | null;
            timesPlayed?: number | string | null;
        };

        const { artist, title, genre, year, timesPlayed } = body;

        updateData = {}; // Reset updateData inside try
        let inputError: string | null = null;

        if (artist !== undefined) {
            if (artist.trim().length < 1) inputError = "Nome do artista não pode ser vazio.";
            else updateData.artist = artist.trim();
        }
        if (title !== undefined) {
             if (title.trim().length < 1) inputError = "Título não pode ser vazio.";
             else updateData.title = title.trim();
        }
        if (genre !== undefined) {
             updateData.genre = genre?.trim() || null;
        }

        // --- FIX: Revised Year Validation ---
        if (year !== undefined) {
            // Attempt to parse only if year is not null or empty string
            const numYear = (year === null || year === '') ? null : parseInt(String(year));

            if (numYear === null) {
                // If the intention was to clear the year, allow it
                if (year === null || year === '') {
                    updateData.year = null;
                } else {
                    // If input was not null/empty but parseInt failed (returned NaN which became null here implicitly before, now handle explicitly)
                    // We check if numYear is NaN after ensuring it's not null.
                    inputError = "Ano inválido (deve ser numérico ou vazio).";
                }
            } else if (isNaN(numYear) || numYear < 1000 || numYear > new Date().getFullYear() + 1) { // Now isNaN check is safe
                 inputError = "Ano inválido (ex: 1995).";
            } else {
                 updateData.year = numYear; // Valid number
            }
        }
        // --- End Fix ---


        if (timesPlayed !== undefined) {
             const numPlays = timesPlayed === null || timesPlayed === '' ? 0 : parseInt(String(timesPlayed)); // Default to 0 if empty/null
             if (isNaN(numPlays) || numPlays < 0) {
                 inputError = "Número de 'vezes tocado' inválido.";
             } else {
                 updateData.timesPlayed = numPlays;
             }
        }

        if (inputError) {
             return NextResponse.json<ApiResponse>({ success: false, error: inputError }, { status: 400 });
        }
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json<ApiResponse>({ success: false, error: "Nenhum dado fornecido para atualização." }, { status: 400 });
        }

        const updatedRecord = await prisma.vinylRecord.update({
            where: { id },
            data: updateData,
        });

        // No Decimals to serialize in VinylRecord
        return NextResponse.json<ApiResponse<VinylRecord>>(
            { success: true, data: updatedRecord },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`PATCH /api/vinyl-records/${id} error:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                const isCompositeKeyError = Array.isArray(target) && target.includes('artist') && target.includes('title');
                if (isCompositeKeyError && (updateData.artist !== undefined || updateData.title !== undefined)) {
                     return NextResponse.json<ApiResponse>({ success: false, error: "Já existe um disco com este artista e título." }, { status: 409 });
                }
            }
            if (error.code === 'P2025') {
                 return NextResponse.json<ApiResponse>({ success: false, error: "Disco não encontrado." }, { status: 404 });
            }
        }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar disco." }, { status: 500 });
    }
}

/**
 * DELETE /api/vinyl-records/[id]
 * Deletes a vinyl record (hard delete for MVP).
 * Requires Admin/Manager role.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
     if (!session.staff?.isLoggedIn || (session.staff.role !== StaffRole.Admin && session.staff.role !== StaffRole.Manager)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 }
        );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json<ApiResponse>({ success: false, error: "ID de disco inválido" }, { status: 400 });
    }

    try {
        await prisma.vinylRecord.delete({
            where: { id },
        });

        return NextResponse.json<ApiResponse>(
            { success: true, data: { message: `Disco ID ${id} excluído com sucesso.` } },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`DELETE /api/vinyl-records/${id} error:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json<ApiResponse>({ success: false, error: "Disco não encontrado." }, { status: 404 });
         }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao excluir disco." }, { status: 500 });
    }
}