// PATH: app/api/ingredients/route.ts
// NOTE: This is a NEW FILE.

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Ingredient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET /api/ingredients
 * Fetches all ingredients
 */
export async function GET(req: NextRequest) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Serialize Decimal fields for JSON response
    const serializedIngredients = ingredients.map((item) => ({
      ...item,
      stock: item.stock.toString(),
      costPerUnit: item.costPerUnit.toString(),
    }));

    return NextResponse.json<ApiResponse<any[]>>(
      { success: true, data: serializedIngredients },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingredients
 * Creates a new ingredient
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, unit, costPerUnit, stock } = body;

    if (!name || !unit || !costPerUnit) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Nome, Unidade e Custo por Unidade são obrigatórios",
        },
        { status: 400 }
      );
    }

    let costDecimal: Decimal;
    let stockDecimal: Decimal;

    try {
      costDecimal = new Decimal(costPerUnit);
      stockDecimal = new Decimal(stock || 0);
    } catch (e) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Formato de número inválido" },
        { status: 400 }
      );
    }

    const newIngredient = await prisma.ingredient.create({
      data: {
        name,
        unit,
        costPerUnit: costDecimal,
        stock: stockDecimal,
      },
    });

    // Serialize Decimal fields for response
    const serializedIngredient = {
      ...newIngredient,
      stock: newIngredient.stock.toString(),
      costPerUnit: newIngredient.costPerUnit.toString(),
    };

    return NextResponse.json<ApiResponse<any>>(
      { success: true, data: serializedIngredient },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ingredient:", error);
    if (error.code === "P2002" && error.meta?.target.includes("name")) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Este ingrediente já existe" },
        { status: 409 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ingredients
 * Updates the stock of an ingredient (adds or removes)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, amount } = body; // amount can be positive or negative

    if (!id || amount === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "ID e Quantidade são obrigatórios" },
        { status: 400 }
      );
    }

    let amountDecimal: Decimal;
    try {
      amountDecimal = new Decimal(amount);
    } catch (e) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Formato de quantidade inválido" },
        { status: 400 }
      );
    }

    if (amountDecimal.isZero()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Quantidade não pode ser zero" },
        { status: 400 }
      );
    }

    // Use Prisma's atomic increment operation
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: id },
      data: {
        stock: {
          increment: amountDecimal,
        },
      },
    });

    // Serialize Decimal fields for response
    const serializedIngredient = {
      ...updatedIngredient,
      stock: updatedIngredient.stock.toString(),
      costPerUnit: updatedIngredient.costPerUnit.toString(),
    };

    return NextResponse.json<ApiResponse<any>>(
      { success: true, data: serializedIngredient },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating stock:", error);
    if (error.code === "P2025") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Ingrediente não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}