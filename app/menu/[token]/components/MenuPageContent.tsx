// File: app/menu/[token]/components/MenuPageContent.tsx
"use client"; // This component handles interactions

import { Container, Title, Text, Paper, Stack, Button, Group } from "@mantine/core";
import { Product, SeatingArea } from "@prisma/client";
import { MenuDisplay } from "@/components/MenuDisplay"; // Assuming MenuDisplay is moved to /components
import { useState } from "react"; // Only client hooks here
import { notifications } from "@mantine/notifications";
import { Hand } from "lucide-react";
import { Prisma } from "@prisma/client"; // Import Prisma for Decimal

// Define props the component accepts
interface MenuPageContentProps {
    seatingArea: SeatingArea;
    initialProducts: Product[]; // Receive initial products
}

// Helper to convert string price back to number/Decimal if needed by MenuDisplay
// Adjust based on what MenuDisplay actually expects
function deserializeProducts(products: any[]): Product[] {
    return products.map(p => ({
        ...p,
        costPrice: new Prisma.Decimal(p.costPrice || 0), // Convert string back to Decimal
        salePrice: new Prisma.Decimal(p.salePrice || 0), // Convert string back to Decimal
        deductionAmountInSmallestUnit: new Prisma.Decimal(p.deductionAmountInSmallestUnit || 1), // Convert string back to Decimal
    }));
}


export function MenuPageContent({ seatingArea, initialProducts }: MenuPageContentProps) {
    // Deserialize products received as props (strings -> Decimals/numbers)
    const [products, setProducts] = useState<Product[]>(deserializeProducts(initialProducts));
    const [loadingCall, setLoadingCall] = useState(false);

    const handleCallServer = () => {
        setLoadingCall(true);
        // Simulate API call or notification system
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
                {/* Ensure MenuDisplay can handle Decimal or Number */}
                <MenuDisplay products={products} />

            </Stack>
        </Container>
    );
}