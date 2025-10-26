// File: app/api/seating-areas/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { SeatingArea, SeatingAreaType, Prisma, Role } from "@prisma/client"; // Added Role

type RouteParams = {
  params: { id: string };
};

/**
 * PATCH /api/seating-areas/[id]
 * Updates an existing seating area.
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
        return NextResponse.json<ApiResponse>({ success: false, error: "ID de área inválido" }, { status: 400 });
    }

    // Define updateData outside try block to use in catch
    let updateData: Prisma.SeatingAreaUpdateInput = {};

    try {
        const body = await req.json();
         const { name, capacity, type, reservationCost, isActive } = body as {
            name?: string;
            capacity?: number | string | null;
            type?: SeatingAreaType;
            reservationCost?: number | string | null;
            isActive?: boolean;
        };

        // Reset updateData inside try
        updateData = {};
        let inputError: string | null = null;

        if (name !== undefined) {
            if (name.trim().length < 1) inputError = "Nome da área não pode ser vazio.";
            else updateData.name = name.trim();
        }
        if (capacity !== undefined) {
             const numCapacity = capacity === null || capacity === '' ? null : parseInt(String(capacity));
             if (numCapacity !== null && (isNaN(numCapacity) || numCapacity < 0)) inputError = "Capacidade inválida.";
             else updateData.capacity = numCapacity;
        }
        if (type !== undefined) {
             if (!Object.values(SeatingAreaType).includes(type as SeatingAreaType)) inputError = "Tipo de área inválido.";
             else updateData.type = type as SeatingAreaType;
        }
        if (reservationCost !== undefined) {
             const numCost = reservationCost === null || reservationCost === '' ? 0 : parseFloat(String(reservationCost));
             if (isNaN(numCost) || numCost < 0) inputError = "Custo de reserva inválido.";
             else updateData.reservationCost = numCost; // Pass number to Prisma
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

        const updatedArea = await prisma.seatingArea.update({
            where: { id },
            data: updateData,
        });

         // Serialize Decimal before returning
         const serializedArea = {
             ...updatedArea,
             reservationCost: Number(updatedArea.reservationCost),
         };

        return NextResponse.json<ApiResponse<SeatingArea>>(
            { success: true, data: serializedArea as any }, // Cast needed
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`PATCH /api/seating-areas/${id} error:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                // --- FIX STARTS HERE ---
                const target = error.meta?.target;
                const isNameError = Array.isArray(target) && target.includes('name');
                const isTokenError = Array.isArray(target) && target.includes('qrCodeToken');
                // --- FIX ENDS HERE ---

                // Check specific fields if they were part of the update request
                if (isNameError && updateData.name !== undefined) {
                    return NextResponse.json<ApiResponse>({ success: false, error: "Já existe uma área com este nome." }, { status: 409 });
                }
                 if (isTokenError && updateData.qrCodeToken !== undefined) { // qrCodeToken cannot be updated via this route currently, but check anyway
                     return NextResponse.json<ApiResponse>({ success: false, error: "Este token QR já está em uso." }, { status: 409 });
                 }
                 // Handle other P2002 errors generically if necessary
            }
            if (error.code === 'P2025') {
                 return NextResponse.json<ApiResponse>({ success: false, error: "Área de assento não encontrada." }, { status: 404 });
            }
        }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao atualizar área de assento." }, { status: 500 });
    }
}

/**
 * DELETE /api/seating-areas/[id]
 * Deletes a seating area (soft delete - sets isActive to false).
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
        return NextResponse.json<ApiResponse>({ success: false, error: "ID de área inválido" }, { status: 400 });
    }

    try {
        const updatedArea = await prisma.seatingArea.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json<ApiResponse>(
            { success: true, data: { message: `Área "${updatedArea.name}" desativada.` } },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`DELETE /api/seating-areas/${id} error:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json<ApiResponse>({ success: false, error: "Área de assento não encontrada." }, { status: 404 });
         }
        return NextResponse.json<ApiResponse>({ success: false, error: "Erro ao desativar área de assento." }, { status: 500 });
    }
}