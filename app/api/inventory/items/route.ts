// File: app/api/inventory/items/route.ts
import { prisma } from "@/lib/prisma"; //
import { getSession } from "@/lib/auth"; //
import { ApiResponse } from "@/lib/types"; //
import { NextRequest, NextResponse } from "next/server"; //
// --- FIX: Use Ingredient model from Prisma schema ---
import { Ingredient, Prisma } from "@prisma/client"; //

// Define the type for the data structure returned (matches Ingredient model)
// Note: Prisma.Decimal fields will be serialized later
type SelectedIngredient = Ingredient; // Using the Prisma type directly initially

// Define the final serialized type expected by the client
type SerializedIngredient = Omit<Ingredient, 'stock' | 'costPerUnit'> & { // Renamed, Omit Decimal fields
  stock: string; // Serialized Decimal field
  costPerUnit: string; // Serialized Decimal field
}; //


/**
 * GET /api/inventory/items -> Should match API call in frontend (/api/ingredients ?)
 * Fetches all defined Ingredient records.
 */
export async function GET(req: NextRequest) { //
  // Auth check - Assuming SessionData has `user` property now
  const session = await getSession(); //
  if (!session.user?.isLoggedIn) { // Corrected check //
    return NextResponse.json<ApiResponse>( //
      { success: false, error: "Não autorizado" }, //
      { status: 401 } //
    ); //
  } //

  try { //
    // --- FIX: Query the Ingredient model ---
    const items: SelectedIngredient[] = await prisma.ingredient.findMany({ //
      // No need for 'select' if fetching all standard Ingredient fields
      orderBy: { name: "asc" }, //
    }); //

    // --- FIX: Serialize Decimal fields to strings ---
    const serializedItems: SerializedIngredient[] = items.map(item => ({ //
       id: item.id, //
       name: item.name, //
       unit: item.unit, // Correct field name //
       // Serialize Prisma Decimal fields
      stock: item.stock.toString(), //
      costPerUnit: item.costPerUnit.toString(), //
      // Removed fields not present in Ingredient model
    })); //


    return NextResponse.json<ApiResponse<SerializedIngredient[]>>( // Use correct serialized type //
      { success: true, data: serializedItems }, //
      { status: 200 } //
    ); //
  } catch (error) { //
    console.error("GET /api/inventory/items error:", error); // Updated path //
    return NextResponse.json<ApiResponse>( //
      { success: false, error: "Erro ao buscar itens de inventário" }, // Updated message //
      { status: 500 } //
    ); //
  } //
} //