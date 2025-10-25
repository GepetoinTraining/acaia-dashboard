"use client";

import { Table, Badge, Text, Center, Loader, Group } from "@mantine/core";
// Import the specific type alias used in the page component
import { ProductWithRelations } from "../page";
import dayjs from "dayjs";
// Import Decimal for type safety if needed, though Number() conversion handles it
import { Prisma } from "@prisma/client";

type ProductTableProps = {
  products: ProductWithRelations[];
  loading: boolean;
};

export function ProductTable({ products, loading }: ProductTableProps) {
  const rows = products.map((item) => {
    const isConsignment = !!item.partner;

    // Convert Decimals to numbers for calculation
    const salePriceNum = Number(item.salePrice);
    const costPriceNum = Number(item.costPrice);

    // Perform calculation with numbers
    const profitMargin =
      salePriceNum > 0 // Compare numbers
        ? ((salePriceNum - costPriceNum) / salePriceNum) * 100 // Calculate with numbers
        : 0;

    return (
      <Table.Tr key={item.id}>
        <Table.Td>
          <Text fw={500}>{item.name}</Text>
          <Text size="xs" c="dimmed">
            {item.category || "Sem categoria"}
          </Text>
        </Table.Td>
        <Table.Td>
          <Badge color={isConsignment ? "grape" : "blue"} variant="light">
            {isConsignment ? `Consignado (${item.partner?.companyName})` : "Estoque Próprio"}
          </Badge>
        </Table.Td>
        <Table.Td>
          {/* Display original Decimal formatted as currency */}
          <Text>R$ {salePriceNum.toFixed(2)}</Text>
        </Table.Td>
        <Table.Td>
           {/* Display original Decimal formatted as currency */}
          <Text c="dimmed">R$ {costPriceNum.toFixed(2)}</Text>
        </Table.Td>
        <Table.Td>
          <Text c={profitMargin > 0 ? "green" : "red"} fw={500}>
            {/* Display calculated number */}
            {profitMargin.toFixed(1)}%
          </Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm">
            {item.inventoryItem?.name || "Não vinculado"}
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Produto</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Preço Venda (R$)</Table.Th>
            <Table.Th>Custo/Dívida (R$)</Table.Th>
            <Table.Th>Margem</Table.Th>
            <Table.Th>Item de Estoque</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Center h={200}>
                  <Loader color="privacyGold" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" c="dimmed" py="lg">
                  Nenhum produto cadastrado.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
