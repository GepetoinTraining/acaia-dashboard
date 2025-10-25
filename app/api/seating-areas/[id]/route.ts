// File: app/api/seating-areas/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { SeatingArea, SeatingAreaType, Prisma } from "@prisma/client";

type RouteParams = {
  params: { id: string };
};

/**
 * PATCH /api/seating-areas/[id]
 * Updates an existing seating area.
 * Requires Admin/Manager role (TODO: Implement role check)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
    // TODO: Add stricter role check (Manager/Admin)
    if (!session.staff?.isLoggedIn) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado" },
            { status: 401 }
        );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "ID de área inválido" },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
         const { name, capacity, type, reservationCost, isActive } = body as {
            name?: string;
            capacity?: number | string | null;
            type?: SeatingAreaType;
            reservationCost?: number | string | null;
            isActive?: boolean; // Allow activating/deactivating
        };

        // --- Build update data ---
        const updateData: Prisma.SeatingAreaUpdateInput = {};
        let inputError: string | null = null;

        if (name !== undefined) {
            if (name.trim().length < 1) {
                inputError = "Nome da área não pode ser vazio.";
            } else {
                updateData.name = name.trim();
            }
        }
        if (capacity !== undefined) {
             const numCapacity = capacity === null ? null : parseInt(String(capacity));
             if (numCapacity !== null && (isNaN(numCapacity) || numCapacity < 0)) {
                 inputError = "Capacidade inválida.";
             } else {
                  updateData.capacity = numCapacity;
             }
        }
        if (type !== undefined) {
             if (!Object.values(SeatingAreaType).includes(type)) {
                 inputError = "Tipo de área inválido.";
             } else {
                  updateData.type = type;
             }
        }
        if (reservationCost !== undefined) {
             const numCost = reservationCost === null ? 0 : parseFloat(String(reservationCost));
             if (isNaN(numCost) || numCost < 0) {
                 inputError = "Custo de reserva inválido.";
             } else {
                 updateData.reservationCost = new Prisma.Decimal(numCost);
             }
        }
         if (isActive !== undefined && typeof isActive === 'boolean') {
             updateData.isActive = isActive;
         }

        if (inputError) {
             return NextResponse.json<ApiResponse>(
                 { success: false, error: inputError },
                 { status: 400 }
             );
        }
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Nenhum dado fornecido para atualização." },
                { status: 400 }
            );
        }
        // --- End build update data ---

        const updatedArea = await prisma.seatingArea.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json<ApiResponse<SeatingArea>>(
            { success: true, data: updatedArea },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(`PATCH /api/seating-areas/${id} error:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: "Já existe uma área com este nome." },
                    { status: 409 } // Conflict
                );
            }
            if (error.code === 'P2025') { // Record to update not found
                 return NextResponse.json<ApiResponse>(
                     { success: false, error: "Área de assento não encontrada." },
                     { status: 404 } // Not Found
                 );
            }
        }
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao atualizar área de assento." },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/seating-areas/[id]
 * Deletes a seating area (soft delete - sets isActive to false).
 * Requires Admin/Manager role (TODO: Implement role check)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    const session = await getSession();
    // TODO: Add stricter role check (Manager/Admin)
    if (!session.staff?.isLoggedIn) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Não autorizado" },
            { status: 401 }
        );
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "ID de área inválido" },
            { status: 400 }
        );
    }

    try {
        // Instead of deleting, we mark as inactive
        const updatedArea = await prisma.seatingArea.update({
            where: { id },
            data: { isActive: false },
        });

        // Optionally check if the record existed before update
        // if (!updatedArea) { ... return 404 ... }

        return NextResponse.json<ApiResponse>(
            { success: true, data: { message: `Área "${updatedArea.name}" desativada.` } },
            { status: 200 } // OK status for successful update/soft delete
        );

    } catch (error: any) {
        console.error(`DELETE /api/seating-areas/${id} error:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json<ApiResponse>(
                 { success: false, error: "Área de assento não encontrada." },
                 { status: 404 } // Not Found
             );
         }
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Erro ao desativar área de assento." },
            { status: 500 }
        );
    }
}