// File: app/api/entertainers/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Entertainer, Prisma, Role, EntertainerType } from "@prisma/client"; // Added Role

type RouteParams = {
    params: { id: string };
};

/**
 * PATCH /api/entertainers/[id]
 * Updates an existing entertainer.
 * Requires Admin/Manager role.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
    // Stricter role check
    if (!session.user?.isLoggedIn || (session.user.role !== Role.OWNER && session.user.role !== Role.MANAGER)) {
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

    // Define updateData outside try to use in catch
    let updateData: Prisma.EntertainerUpdateInput = {};

    try {
        const body = await req.json() as {
            name?: string;
            type?: string;
            contactNotes?: string | null;
            isActive?: boolean;
        };

        const { name, type, contactNotes, isActive } = body;

        let inputError: string | null = null;

        if (name !== undefined) {
            if (name.trim().length < 1) inputError = "Nome não pode ser vazio.";
            else updateData.name = name.trim();
        }
        if (type !== undefined) {
                // Validate against the imported EntertainerType enum
            if (!Object.values(EntertainerType).includes(type)) {
                inputError = "Tipo de artista inválido.";
            } else {
                updateData.type = type; // Assign the validated enum value directly
            }
        }
        if (contactNotes !== undefined) {
             updateData.contactNotes = contactNotes || null;
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
            if (error.code === 'P2002') {
                // --- FIX STARTS HERE ---
                const target = error.meta?.target;
                const isNameError = Array.isArray(target) && target.includes('name');
                // --- FIX ENDS HERE ---

                // Only return specific error if name was being updated and caused the conflict
                if (isNameError && updateData.name !== undefined) {
                     return NextResponse.json<ApiResponse>({ success: false, error: "Já existe um artista com este nome." }, { status: 409 });
                }
                // Handle other potential unique constraint errors if needed
            }
            if (error.code === 'P2025') {
                 return NextResponse.json<ApiResponse>({ success: false, error: "Artista não encontrado." }, { status: 404 });
            }
        }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar artista." }, { status: 500 });
    }
}

/**
 * DELETE /api/entertainers/[id]
 * Deletes an entertainer (soft delete - sets isActive to false).
 * Requires Admin/Manager role.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
     if (!session.user?.isLoggedIn || (session.user.role !== Role.OWNER && session.user.role !== Role.MANAGER)) {
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
        const updatedEntertainer = await prisma.entertainer.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json<ApiResponse>(
            { success: true, data: { message: `Artista "${updatedEntertainer.name}" desativado.` } },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`DELETE /api/entertainers/${id} error:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json<ApiResponse>({ success: false, error: "Artista não encontrado." }, { status: 404 });
         }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao desativar artista." }, { status: 500 });
    }
}