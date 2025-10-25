// File: app/dashboard/bar/components/InventoryItemTable.tsx
"use client";

import {
  Table,
  Text,
  Center,
  Loader,
  ActionIcon,
} from "@mantine/core";
// --- FIX: Import UnitOfMeasure ---
import { InventoryItem, UnitOfMeasure } from "@prisma/client";
import { Plus } from "lucide-react";

// Define the type expected by this component (matching page.tsx)
type SerializedInventoryItem = Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest' | 'createdAt'> & {
  storageUnitSizeInSmallest: number | null;
  reorderThresholdInSmallest: number | null;
  // --- FIX: Ensure enum type ---
  smallestUnit: UnitOfMeasure;
};


type InventoryItemTableProps = {
  items: SerializedInventoryItem[];
  loading: boolean;
  onAddStock: (item: SerializedInventoryItem) => void;
};

// --- FIX: Ensure function is exported ---
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
          {item.storageUnitName || 'N/A'} ({(item.storageUnitSizeInSmallest?.toString() ?? 'N/A')}{" "}
          {item.smallestUnit})
        </Text>
      </Table.Td>
      <Table.Td>
        <Text c="dimmed">
          {item.reorderThresholdInSmallest?.toString() ?? "N/A"}
        </Text>
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
  ));

  const colSpan = 4; // Adjusted columns

  return (
    <Table.ScrollContainer minWidth={600}> {/* Adjusted minWidth */}
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome do Item</Table.Th>
            <Table.Th>Unidade de Armazenagem</Table.Th>
            <Table.Th>Nível de Alerta</Table.Th>
            <Table.Th>Adicionar</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={colSpan}>
                <Center h={200}>
                  <Loader color="pastelGreen" /> {/* Use theme color */}
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={colSpan}>
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