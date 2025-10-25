// File: app/api/vinyl-records/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { VinylRecord, Prisma } from "@prisma/client";

type RouteParams = {
    params: { id: string };
};

/**
 * PATCH /api/vinyl-records/[id]
 * Updates an existing vinyl record.
 * Requires Admin/Manager role (TODO: Implement stricter role check).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
    // TODO: Add stricter role check (Manager/Admin)
     if (!session.staff?.isLoggedIn || (session.staff.role !== 'Admin' && session.staff.role !== 'Manager')) {
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
        const body = await req.json() as {
            artist?: string;
            title?: string;
            genre?: string | null;
            year?: number | string | null;
            timesPlayed?: number | string | null; // Allow updating plays maybe?
        };

        const { artist, title, genre, year, timesPlayed } = body;

        // --- Build update data ---
        const updateData: Prisma.VinylRecordUpdateInput = {};
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
             updateData.genre = genre?.trim() || null; // Allow setting to null or empty
        }
        if (year !== undefined) {
            const numYear = year ? parseInt(String(year)) : null;
             if (year && (isNaN(numYear) || numYear === null || numYear < 1000 || numYear > new Date().getFullYear() + 1)) {
                 inputError = "Ano inválido.";
             } else {
                 updateData.year = numYear; // Allow setting to null
             }
        }
        if (timesPlayed !== undefined) {
             const numPlays = timesPlayed ? parseInt(String(timesPlayed)) : 0;
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
        // --- End build update data ---

        const updatedRecord = await prisma.vinylRecord.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json<ApiResponse<VinylRecord>>(
            { success: true, data: updatedRecord },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`PATCH /api/vinyl-records/${id} error:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002' && error.meta?.target?.includes('artist') && error.meta?.target?.includes('title')) {
                 return NextResponse.json<ApiResponse>({ success: false, error: "Já existe um disco com este artista e título." }, { status: 409 });
            }
            if (error.code === 'P2025') { // Record to update not found
                 return NextResponse.json<ApiResponse>({ success: false, error: "Disco não encontrado." }, { status: 404 });
            }
        }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar disco." }, { status: 500 });
    }
}

/**
 * DELETE /api/vinyl-records/[id]
 * Deletes a vinyl record (hard delete for MVP).
 * Requires Admin/Manager role (TODO: Implement stricter role check).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
     if (!session.staff?.isLoggedIn || (session.staff.role !== 'Admin' && session.staff.role !== 'Manager')) {
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
        // Hard delete for now - consider soft delete (e.g., isActive flag) if needed later
        await prisma.vinylRecord.delete({
            where: { id },
        });

        return NextResponse.json<ApiResponse>(
            { success: true, data: { message: `Disco ID ${id} excluído com sucesso.` } },
            { status: 200 } // OK status for successful deletion
        );

    } catch (error: any) {
        console.error(`DELETE /api/vinyl-records/${id} error:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json<ApiResponse>({ success: false, error: "Disco não encontrado." }, { status: 404 });
         }
        // Handle potential foreign key constraints later if VinylRecord gets linked to DJSession Plays
        // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') { ... }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao excluir disco." }, { status: 500 });
    }
}