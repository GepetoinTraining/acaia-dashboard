// File: app/api/entertainers/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Entertainer, Prisma } from "@prisma/client";

type RouteParams = {
    params: { id: string };
};

/**
 * PATCH /api/entertainers/[id]
 * Updates an existing entertainer.
 * Requires Admin/Manager role (TODO: Implement stricter role check).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
    // TODO: Add stricter role check (Manager/Admin)
     if (!session.staff?.isLoggedIn || session.staff.role !== 'Admin' && session.staff.role !== 'Manager') {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 }
        );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "ID de artista inválido" },
            { status: 400 }
        );
    }

    try {
        const body = await req.json() as {
            name?: string;
            type?: string;
            contactNotes?: string | null;
            isActive?: boolean;
        };

        const { name, type, contactNotes, isActive } = body;

        // --- Build update data ---
        const updateData: Prisma.EntertainerUpdateInput = {};
        let inputError: string | null = null;

        if (name !== undefined) {
            if (name.trim().length < 1) inputError = "Nome não pode ser vazio.";
            else updateData.name = name.trim();
        }
        if (type !== undefined) {
             if (type.trim().length < 1) inputError = "Tipo não pode ser vazio.";
             else updateData.type = type.trim();
        }
        if (contactNotes !== undefined) {
             updateData.contactNotes = contactNotes || null; // Allow setting to null
        }
        if (isActive !== undefined && typeof isActive === 'boolean') {
             updateData.isActive = isActive;
        }

        if (inputError) {
             return NextResponse.json<ApiResponse>({ success: false, error: inputError }, { status: 400 });
        }
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json<ApiResponse>({ success: false, error: "Nenhum dado fornecido para atualização." }, { status: 400 });
        }
        // --- End build update data ---

        const updatedEntertainer = await prisma.entertainer.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json<ApiResponse<Entertainer>>(
            { success: true, data: updatedEntertainer },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`PATCH /api/entertainers/${id} error:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                 return NextResponse.json<ApiResponse>({ success: false, error: "Já existe um artista com este nome." }, { status: 409 });
            }
            if (error.code === 'P2025') { // Record to update not found
                 return NextResponse.json<ApiResponse>({ success: false, error: "Artista não encontrado." }, { status: 404 });
            }
        }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar artista." }, { status: 500 });
    }
}

/**
 * DELETE /api/entertainers/[id]
 * Deletes an entertainer (soft delete - sets isActive to false).
 * Requires Admin/Manager role (TODO: Implement stricter role check).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
     if (!session.staff?.isLoggedIn || session.staff.role !== 'Admin' && session.staff.role !== 'Manager') {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado (Admin/Manager required)" },
            { status: 403 }
        );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json<ApiResponse>({ success: false, error: "ID de artista inválido" }, { status: 400 });
    }

    try {
        // Soft delete by marking as inactive
        const updatedEntertainer = await prisma.entertainer.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json<ApiResponse>(
            { success: true, data: { message: `Artista "${updatedEntertainer.name}" desativado.` } },
            { status: 200 } // OK status for successful update/soft delete
        );

    } catch (error: any) {
        console.error(`DELETE /api/entertainers/${id} error:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json<ApiResponse>({ success: false, error: "Artista não encontrado." }, { status: 404 });
         }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao desativar artista." }, { status: 500 });
    }
}