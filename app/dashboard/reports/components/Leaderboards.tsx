"use client";

import {
  SimpleGrid,
  Paper,
  Title,
  Text,
  Table,
} from "@mantine/core";
import {
  HostessLeaderboardItem,
  ProductLeaderboardItem,
} from "@/lib/types";

type LeaderboardsProps = {
  topHostesses: HostessLeaderboardItem[];
  topProducts: ProductLeaderboardItem[];
};

export function Leaderboards({
  topHostesses,
  topProducts,
}: LeaderboardsProps) {
  const hostessRows = topHostesses.map((item, index) => (
    <Table.Tr key={item.hostId}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{item.stageName}</Table.Td>
      <Table.Td>R$ {item.totalSales.toFixed(2)}</Table.Td>
    </Table.Tr>
  ));

  const productRows = topProducts.map((item, index) => (
    <Table.Tr key={item.productId}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{item.name}</Table.Td>
      <Table.Td>{item.totalSold} unidades</Table.Td>
    </Table.Tr>
  ));

  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }}>
      {/* Top Hostesses */}
      <Paper withBorder p="md" radius="md">
        <Title order={5}>Top 5 Hostesses (Faturamento)</Title>
        <Table.ScrollContainer minWidth={300}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Nome</Table.Th>
                <Table.Th>Total (R$)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{hostessRows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {/* Top Products */}
      <Paper withBorder p="md" radius="md">
        <Title order={5}>Top 5 Produtos (Unidades)</Title>
        <Table.ScrollContainer minWidth={300}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Produto</Table.Th>
                <Table.Th>Total (Qtd)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{productRows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </SimpleGrid>
  );
}
