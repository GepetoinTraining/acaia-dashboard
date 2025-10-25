// File: app/menu/[token]/page.tsx
import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { notFound } from "next/navigation";
import { Container, Title, Text, Paper, Stack } from "@mantine/core";
import { Product, SeatingArea } from "@prisma/client";
import { MenuDisplay } from "@/app/components/MenuDisplay"; // Import the new component

type MenuPageProps = {
  params: {
    token: string;
  };
};

// --- Data Fetching Function (Server Side - unchanged) ---
async function getMenuData(token: string): Promise<{ seatingArea: SeatingArea | null; products: Product[] }> {
    const seatingArea = await prisma.seatingArea.findUnique({
        where: { qrCodeToken: token, isActive: true },
    });

    let products: Product[] = [];
    if (seatingArea) {
        products = await prisma.product.findMany({
            orderBy: [{ type: 'asc' }, { category: 'asc' }, { name: 'asc' }],
             // We can add a displayOrder field later: orderBy: [{ type: 'asc' }, { category: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }]
        });
    }

    return { seatingArea, products };
}


// --- The Page Component (Server Component - Refactored) ---
export default async function MenuPage({ params }: MenuPageProps) {
  const { token } = params;
  const { seatingArea, products } = await getMenuData(token);

  if (!seatingArea) {
    notFound();
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header Section */}
        <Paper p="lg" radius="md" withBorder>
          <Title order={1} ta="center">Acaia Menu</Title>
          <Text ta="center" c="dimmed">
            Você está em: <Text component="span" fw={700}>{seatingArea.name}</Text>
          </Text>
          {/* Placeholder for Client Component Button */}
          {/* <CallServerButton seatingAreaId={seatingArea.id} /> */}
          <Text ta="center" mt="sm">(Botão "Chamar Garçom" virá aqui)</Text>
        </Paper>

        {/* Use the reusable MenuDisplay component */}
        <MenuDisplay products={products} />

      </Stack>
    </Container>
  );
}

// Optional: Add metadata for the page title (unchanged)
export async function generateMetadata({ params }: MenuPageProps) {
    const { seatingArea } = await getMenuData(params.token);
    const title = seatingArea ? `Menu - ${seatingArea.name} | Acaia` : "Menu | Acaia";
    return { title };
}