// File: app/menu/[token]/page.tsx
"use client"; // Make this a Client Component to handle interactions

import { prisma } from "@/lib/prisma"; // Keep server-side import for data fetching function
import { notFound, useParams } from "next/navigation"; // Use client-side hook
import { Container, Title, Text, Paper, Stack, Button, Group } from "@mantine/core";
import { Product, SeatingArea } from "@prisma/client";
import { MenuDisplay } from "@/components/MenuDisplay"; // Assuming MenuDisplay is moved to /components
import { useEffect, useState } from "react"; // Import hooks for client-side data fetching
import { ApiResponse } from "@/lib/types"; // Import ApiResponse
import { notifications } from "@mantine/notifications"; // Import notifications
import { Hand } from "lucide-react"; // Icon for the button

// Define props for the client component part
interface MenuPageContentProps {
    seatingArea: SeatingArea;
    initialProducts: Product[]; // Pass initial products from server fetch
}

// --- Client Component Logic ---
function MenuPageContent({ seatingArea, initialProducts }: MenuPageContentProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loadingCall, setLoadingCall] = useState(false);
    // You could add state here later for cart functionality if needed

    const handleCallServer = () => {
        setLoadingCall(true);
        // Simulate API call or notification system (for MVP, just show notification)
        setTimeout(() => {
            notifications.show({
                title: "Atendimento Chamado",
                message: `Um atendente foi notificado para ir até ${seatingArea.name}.`,
                color: "green",
                autoClose: 5000,
            });
            setLoadingCall(false);
        }, 750); // Simulate network delay
    };

    // --- Render ---
    return (
        <Container size="md" py="xl">
            <Stack gap="xl">
                {/* Header Section */}
                <Paper p="lg" radius="md" withBorder>
                    <Title order={1} ta="center">Acaia Menu</Title>
                    <Text ta="center" c="dimmed" mt="xs">
                        Você está em: <Text component="span" fw={700}>{seatingArea.name}</Text>
                    </Text>
                    {/* Call Server Button */}
                    <Group justify="center" mt="lg">
                        <Button
                            leftSection={<Hand size={18} />}
                            onClick={handleCallServer}
                            loading={loadingCall}
                            variant="light"
                            color="blue" // Or theme color like "pastelGreen"
                            size="md"
                        >
                            Chamar Garçom
                        </Button>
                    </Group>
                </Paper>

                {/* Use the reusable MenuDisplay component */}
                <MenuDisplay products={products} />

            </Stack>
        </Container>
    );
}


// --- Data Fetching and Main Page Export (Server Component Wrapper) ---
// This part runs on the server initially to get data
async function getMenuData(token: string): Promise<{ seatingArea: SeatingArea | null; products: Product[] }> {
    const seatingArea = await prisma.seatingArea.findUnique({
        where: { qrCodeToken: token, isActive: true },
    });

    let products: Product[] = [];
    if (seatingArea) {
        // Fetch products, converting Decimal to string/number for serialization
        const fetchedProducts = await prisma.product.findMany({
            // where: { isActive: true }, // Add if you have an isActive flag on Product
            orderBy: [{ type: 'asc' }, { category: 'asc' }, { name: 'asc' }],
        });
         // Serialize Decimal fields
        products = fetchedProducts.map(p => ({
             ...p,
             costPrice: p.costPrice.toString(), // Convert Decimal to string
             salePrice: p.salePrice.toString(), // Convert Decimal to string
             deductionAmountInSmallestUnit: p.deductionAmountInSmallestUnit.toString(), // Convert Decimal to string
        })) as unknown as Product[]; // Cast needed because Decimal->string changes type temporarily
    }

    return { seatingArea, products };
}


export default async function MenuPage({ params }: { params: { token: string } }) {
    const { token } = params;
    const { seatingArea, products } = await getMenuData(token);

    if (!seatingArea) {
        notFound(); // Triggers 404 page
    }

     // Convert serialized product prices back to numbers/Decimal if MenuDisplay expects them
     // For now, assuming MenuDisplay handles strings or uses Number()
     const clientProducts = products.map(p => ({
         ...p,
         // costPrice: new Prisma.Decimal(p.costPrice), // Example if needed
         // salePrice: new Prisma.Decimal(p.salePrice), // Example if needed
     }));


    // Render the client component part, passing server-fetched data as props
    return <MenuPageContent seatingArea={seatingArea} initialProducts={clientProducts} />;
}

// --- Metadata Generation (remains server-side) ---
export async function generateMetadata({ params }: { params: { token: string } }) {
    // Re-fetch minimal data needed for metadata
     const seatingArea = await prisma.seatingArea.findUnique({
         where: { qrCodeToken: params.token, isActive: true },
         select: { name: true } // Only select name
     });
    const title = seatingArea ? `Menu - ${seatingArea.name} | Acaia` : "Menu | Acaia";
    return { title };
}