// File: app/menu/[token]/components/MenuPageContent.tsx
"use client"; // This component handles interactions

import { Container, Title, Text, Paper, Stack, Button, Group } from "@mantine/core";
import { Product, SeatingArea } from "@prisma/client";
import { MenuDisplay } from "@/components/MenuDisplay"; // Assuming MenuDisplay is moved to /components
import { useState } from "react"; // Only client hooks here
import { notifications } from "@mantine/notifications";
import { Hand } from "lucide-react";
// Removed Prisma import, use Number() instead

// Define props the component accepts
interface MenuPageContentProps {
    seatingArea: SeatingArea;
    initialProducts: Product[]; // Receive initial products (prices are strings)
}

// Helper to convert string price back to number for client-side use
function deserializeProducts(products: any[]): Product[] {
    return products.map(p => ({
        ...p,
        // Convert serialized string prices back to numbers
        costPrice: parseFloat(p.costPrice || '0'),
        salePrice: parseFloat(p.salePrice || '0'),
        deductionAmountInSmallestUnit: parseFloat(p.deductionAmountInSmallestUnit || '1'),
        // Ensure other fields match Product type if necessary
    }));
}


export function MenuPageContent({ seatingArea, initialProducts }: MenuPageContentProps) {
    // Deserialize products received as props (strings -> numbers)
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
                            // Updated color to theme color
                            color="pastelGreen"
                            size="md"
                        >
                            Chamar Garçom
                        </Button>
                    </Group>
                </Paper>

                {/* Pass products with number prices to MenuDisplay */}
                {/* Ensure MenuDisplay can handle 'number' for prices */}
                <MenuDisplay products={products} />

            </Stack>
        </Container>
    );
}