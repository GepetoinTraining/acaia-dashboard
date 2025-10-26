// PATH: app/api/orders/route.ts
// NOTE: This is a NEW FILE (replaces /api/sales)

import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { Order, OrderItem, Product, User } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { getSession } from "@/lib/auth"; // To get the logged-in user

// Type for items coming from the cart
type CartItem = {
  productId: string;
  quantity: number;
};

/**
 * POST /api/orders
 * Creates a new order for a specific visit
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  const user = session.user;

  // 1. Check for authenticated user
  if (!user || !user.isLoggedIn) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Usuário não autenticado" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { visitId, items } = body as {
      visitId: string;
      items: CartItem[];
    };

    if (!visitId || !items || items.length === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "ID da Visita e Itens são obrigatórios",
        },
        { status: 400 }
      );
    }

    // 2. Fetch all product details from the DB
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    // 3. Create a map for quick lookup and validate items
    const productMap = new Map<string, Product>();
    products.forEach((p) => productMap.set(p.id, p));

    let totalOrderPrice = new Decimal(0);
    const orderItemsData = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Produto com ID ${item.productId} não encontrado.`);
      }

      const unitPrice = product.price;
      const itemTotalPrice = unitPrice.times(item.quantity);
      totalOrderPrice = totalOrderPrice.plus(itemTotalPrice);

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: itemTotalPrice,
        workstationId: product.prepStationId, // Assign to the product's prep station
      });
    }

    // 4. Create the Order, OrderItems, HandledOrder, and update Visit in a transaction
    const [newOrder, updatedVisit] = await prisma.$transaction(async (tx) => {
      // Create the main Order
      const order = await tx.order.create({
        data: {
          visitId: visitId,
          clientId: (
            await tx.visit.findUnique({ where: { id: visitId } })
          )?.clientId,
          total: totalOrderPrice,
          status: "PENDING", // Default status
          // Create all OrderItems linked to this Order
          items: {
            createMany: {
              data: orderItemsData,
            },
          },
          // Link the user (staff) who handled the order
          handledBy: {
            create: {
              userId: user.id,
            },
          },
        },
      });

      // Update the Visit's totalSpent atomically
      const visit = await tx.visit.update({
        where: { id: visitId },
        data: {
          totalSpent: {
            increment: totalOrderPrice,
          },
        },
      });

      // TODO: Add logic here to decrement Ingredient.stock based on Recipes
      // This is a future enhancement for a later chunk.

      return [order, visit];
    });

    return NextResponse.json<ApiResponse<Order>>(
      { success: true, data: newOrder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}