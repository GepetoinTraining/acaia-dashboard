"use client";

import {
  Table,
  Text,
  Center,
  Loader,
  ActionIcon,
} from "@mantine/core";
import { InventoryItem, SmallestUnit } from "@prisma/client";
// Removed dayjs as it's no longer needed here
// import dayjs from "dayjs";
import { Plus } from "lucide-react";

// Define the type expected by this component
// REMOVED createdAt
type SerializedInventoryItem = Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest' | 'createdAt'> & { // Added createdAt to Omit
  storageUnitSizeInSmallest: number | null;
  reorderThresholdInSmallest: number | null;
  // createdAt: Date; // REMOVED
};


type InventoryItemTableProps = {
  items: SerializedInventoryItem[];
  loading: boolean;
  onAddStock: (item: SerializedInventoryItem) => void;
};


export function InventoryItemTable({
  items,
  loading,
  onAddStock,
}: InventoryItemTableProps) {
  const rows = items.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Text fw={500}>{item.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text>
          {item.storageUnitName} ({item.storageUnitSizeInSmallest?.toString() || 'N/A'}{" "}
          {item.smallestUnit})
        </Text>
      </Table.Td>
      <Table.Td>
        <Text c="dimmed">
          {item.reorderThresholdInSmallest?.toString() || "N/A"}
        </Text>
      </Table.Td>
      {/* REMOVED CreatedAt Table.Td */}
      {/* <Table.Td>
        <Text size="sm" c="dimmed">
          {item.createdAt ? dayjs(item.createdAt).format("DD/MM/YYYY") : "N/A"}
        </Text>
      </Table.Td> */}
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
  ));

  // Adjust colSpan if necessary (reduced from 5 to 4)
  const colSpan = 4;

  return (
    <Table.ScrollContainer minWidth={800}> {/* Adjusted minWidth potentially */}
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome do Item</Table.Th>
            <Table.Th>Unidade de Armazenagem</Table.Th>
            <Table.Th>Nível de Alerta</Table.Th>
            {/* REMOVED CreatedAt Table.Th */}
            {/* <Table.Th>Criado em</Table.Th> */}
            <Table.Th>Adicionar</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={colSpan}> {/* Use colSpan variable */}
                <Center h={200}>
                  <Loader color="privacyGold" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={colSpan}> {/* Use colSpan variable */}
                <Text ta="center" c="dimmed" py="lg">
                  Nenhum item de inventário definido.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}