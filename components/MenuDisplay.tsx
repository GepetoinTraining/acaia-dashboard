"use client"; // This component might handle interactions later (like add to cart)

import { Product, ProductType } from "@prisma/client";
import { formatCurrency } from "@/lib/utils"; // Adjust path if needed
import { Container, Title, Text, SimpleGrid, Paper, Stack, Group, Badge } from "@mantine/core";
import { Utensils, GlassWater } from 'lucide-react'; // Icons for food/drink
import React from "react"; // Import React for ReactNode type

// Define the props the component accepts
interface MenuDisplayProps {
    products: Product[];
    // Add other props later if needed, e.g., onAddToCart callback
}

export function MenuDisplay({ products }: MenuDisplayProps) {

    // Separate products into food and drink for display
    const foodItems = products.filter(p => p.type === ProductType.FOOD);
    const drinkItems = products.filter(p => p.type === ProductType.DRINK);
    const otherItems = products.filter(p => p.type === ProductType.OTHER);

    // Helper to render a list of products
    // (Note: This is the same logic as before, just inside the component)
    const renderProductList = (items: Product[], title: string, icon: React.ReactNode) => (
        <Stack gap="md" key={title}> {/* Added key for list rendering */}
            <Group gap="xs">
                {icon}
                <Title order={3}>{title}</Title>
            </Group>
            {items.length === 0 ? (
                <Text c="dimmed">Nenhum item disponível nesta categoria.</Text>
            ) : (
                // Using SimpleGrid for potentially better layout control than just Stack
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {items.map((product) => (
                        <Paper key={product.id} p="sm" withBorder radius="sm" shadow="xs">
                            <Group justify="space-between" align="flex-start">
                                <Stack gap={0}>
                                    <Text fw={500}>{product.name}</Text>
                                    {product.category && <Text size="xs" c="dimmed">{product.category}</Text>}
                                    {/* Add description later if needed */}
                                    {/* <Text size="xs" mt="xs">{product.description || ''}</Text> */}
                                </Stack>
                                <Badge variant="light" color="pastelGreen" size="lg" style={{ flexShrink: 0 }}>
                                    {formatCurrency(Number(product.salePrice))}
                                </Badge>
                            </Group>
                        </Paper>
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );

    return (
        <Stack gap="xl">
            {/* Render Menu Sections */}
            {renderProductList(foodItems, "Comidas", <Utensils size={24} />)}
            {renderProductList(drinkItems, "Bebidas", <GlassWater size={24} />)}
            {otherItems.length > 0 && renderProductList(otherItems, "Outros", <span /> /* No specific icon */)}
        </Stack>
    );
}