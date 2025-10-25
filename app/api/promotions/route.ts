import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { PromotionBulletin } from "@prisma/client";

/**
 * GET /api/promotions
 * Fetches all promotions.
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
    const promotions = await prisma.promotionBulletin.findMany({
      include: {
        product: true, // Include the linked product
      },
      orderBy: { expiresAt: "desc" },
    });
    return NextResponse.json<ApiResponse<PromotionBulletin[]>>(
      { success: true, data: promotions as any }, // Cast as any to include relations
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/promotions error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar promoções" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/promotions
 * Creates a new promotion.
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
    const { title, body: textBody, bonusOffer, productId, expiresAt } = body;

    if (!title || !textBody || !expiresAt) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const newPromotion = await prisma.promotionBulletin.create({
      data: {
        title,
        body: textBody,
        bonusOffer,
        expiresAt: new Date(expiresAt),
        productId: productId ? parseInt(productId) : null,
      },
    });

    return NextResponse.json<ApiResponse<PromotionBulletin>>(
      { success: true, data: newPromotion },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/promotions error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar promoção" },
      { status: 500 }
    );
  }
}
