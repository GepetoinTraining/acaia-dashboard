// PATH: app/dashboard/inventory/components/IngredientTable.tsx
// NOTE: This is a NEW FILE in a NEW FOLDER.

"use client";

import {
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Text,
  Loader,
  Group,
} from "@mantine/core";
import { IconPencil, IconStackPush, IconTrash } from "@tabler/icons-react";
import { SerializedIngredient } from "../page"; // Import the extended type
import { formatCurrency } from "@/lib/utils"; // Assuming you have this util

interface IngredientTableProps {
  data: SerializedIngredient[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateStock: (ingredient: SerializedIngredient) => void;
  // TODO: Add onEdit and onDelete handlers
}

export function IngredientTable({
  data,
  isLoading,
  onRefresh,
  onUpdateStock,
}: IngredientTableProps) {
  const rows = data.map((item) => {
    const stock = parseFloat(item.stock);
    const cost = parseFloat(item.costPerUnit);

    return (
      <Table.Tr key={item.id}>
        <Table.Td>{item.name}</Table.Td>
        <Table.Td>
          <Badge color={stock <= 0 ? "red" : stock < 10 ? "yellow" : "green"}>
            {stock}
          </Badge>
        </Table.Td>
        <Table.Td>{item.unit}</Table.Td>
        <Table.Td>{formatCurrency(cost)}</Table.Td>
        <Table.Td>
          {/* Total Cost Value = Stock * Cost per Unit */}
          {formatCurrency(stock * cost)}
        </Table.Td>
        <Table.Td>
          <Group gap="xs" wrap="nowrap">
            <Tooltip label="Ajustar Estoque">
              <ActionIcon
                variant="transparent"
                color="blue"
                onClick={() => onUpdateStock(item)}
              >
                <IconStackPush size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Editar">
              <ActionIcon variant="transparent" color="gray">
                <IconPencil size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Remover">
              <ActionIcon variant="transparent" color="red">
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Table.ScrollContainer minWidth={700}>
      <Table verticalSpacing="sm" striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Estoque Atual</Table.Th>
            <Table.Th>Unidade (UN)</Table.Th>
            <Table.Th>Custo por UN</Table.Th>
            <Table.Th>Valor Total (Custo)</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center">Nenhum ingrediente encontrado</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}