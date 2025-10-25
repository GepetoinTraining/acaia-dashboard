import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@prisma/client";

/**
 * GET /api/products
 * Fetches all products with relations.
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
    const products = await prisma.product.findMany({
      include: {
        inventoryItem: true, // Include the linked inventory item
        partner: true,       // Include the linked partner
      },
      orderBy: { category: "asc" },
    });
    return NextResponse.json<ApiResponse<Product[]>>(
      { success: true, data: products as any }, // Cast as any to include relations
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Creates a new product.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.staff?.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Não autorizado" },
      { status: 401 }
    );
  }
  // TODO: Add role check

  try {
    const body = await req.json();
    const {
      name,
      category,
      costPrice,
      salePrice,
      inventoryItemId,
      deductionAmount,
      partnerId,
    } = body;

    if (!name || !salePrice || !inventoryItemId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        category,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice),
        deductionAmountInSmallestUnit: parseFloat(deductionAmount) || 1,
        inventoryItemId: inventoryItemId ? parseInt(inventoryItemId) : null,
        partnerId: partnerId ? parseInt(partnerId) : null,
      },
    });

    return NextResponse.json<ApiResponse<Product>>(
      { success: true, data: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
