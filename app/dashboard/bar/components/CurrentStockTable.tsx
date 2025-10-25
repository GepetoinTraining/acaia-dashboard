"use client";

import {
  Table,
  Text,
  Center,
  Loader,
  Badge,
  ActionIcon,
} from "@mantine/core";
import { AggregatedStock } from "@/lib/types";
import { Plus } from "lucide-react";

type CurrentStockTableProps = {
  stockLevels: AggregatedStock[];
  loading: boolean;
  onAddStock: (item: AggregatedStock) => void;
};

export function CurrentStockTable({
  stockLevels,
  loading,
  onAddStock,
}: CurrentStockTableProps) {
const rows = stockLevels.map((item) => {
    const isLowStock =
      item.reorderThreshold !== null &&
      item.totalStock <= item.reorderThreshold;
    
    return (
      <Table.Tr key={item.inventoryItemId}>
        <Table.Td>
          <Text fw={500}>{item.name}</Text>
        </Table.Td>
        <Table.Td>
          <Text fw={700} c={isLowStock ? "red" : "unset"}>
            {item.totalStock.toLocaleString("pt-BR")} {/* << FIXED */}
          </Text>
        </Table.Td>
        <Table.Td>
          <Text c="dimmed">{item.smallestUnit}</Text>
        </Table.Td>
        <Table.Td>
          {isLowStock ? (
            <Badge color="red" variant="filled">
              Baixo
            </Badge>
          ) : (
            <Badge color="green" variant="light">
              OK
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => onAddStock(item)}
            title="Adicionar estoque (compra)"
          >
            <Plus size={16} />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Item</Table.Th>
            <Table.Th>Qtd. Atual</Table.Th>
            <Table.Th>Unidade</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Adicionar</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Center h={200}>
                  <Loader color="privacyGold" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text ta="center" c="dimmed" py="lg">
                  Nenhum item em estoque. Defina um item e adicione estoque.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
