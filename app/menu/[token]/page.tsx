// File: app/menu/[token]/page.tsx - NOW A SERVER COMPONENT

import { prisma } from "@/lib/prisma"; // Server-side import
import { notFound } from "next/navigation"; // Server-side function
import { SeatingArea, Product } from "@prisma/client";
import { MenuPageContent } from "./components/MenuPageContent"; // Import the new client component
import { Prisma } from "@prisma/client"; // Import Prisma

// --- Data Fetching Function (Server Side - unchanged logic, added serialization) ---
async function getMenuData(token: string): Promise<{ seatingArea: SeatingArea | null; products: Product[] }> {
    const seatingArea = await prisma.seatingArea.findUnique({
        where: { qrCodeToken: token, isActive: true },
    });

    let products: Product[] = [];
    if (seatingArea) {
        // Fetch products
        const fetchedProducts = await prisma.product.findMany({
            // where: { isActive: true }, // Add if needed
            orderBy: [{ type: 'asc' }, { category: 'asc' }, { name: 'asc' }],
        });
        // Serialize Decimal fields TO STRINGS for passing to client component
        products = fetchedProducts.map(p => ({
            ...p,
            costPrice: p.costPrice.toString(),
            salePrice: p.salePrice.toString(),
            deductionAmountInSmallestUnit: p.deductionAmountInSmallestUnit.toString(),
        })) as unknown as Product[]; // Type assertion needed due to serialization
    }

    return { seatingArea, products };
}


// --- The Page Component (Server Component Wrapper) ---
export default async function MenuPage({ params }: { params: { token: string } }) {
    const { token } = params;
    const { seatingArea, products } = await getMenuData(token);

    if (!seatingArea) {
        notFound(); // Triggers 404 page
    }

    // Pass serialized data (products with string prices) to the client component
    return <MenuPageContent seatingArea={seatingArea} initialProducts={products} />;
}


// --- Metadata Generation (remains server-side, unchanged) ---
export async function generateMetadata({ params }: { params: { token: string } }) {
    const seatingArea = await prisma.seatingArea.findUnique({
        where: { qrCodeToken: params.token, isActive: true },
        select: { name: true }
    });
    const title = seatingArea ? `Menu - ${seatingArea.name} | Acaia` : "Menu | Acaia";
    return { title };
}