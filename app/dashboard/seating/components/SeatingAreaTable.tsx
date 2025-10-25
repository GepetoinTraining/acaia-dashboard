// File: app/dashboard/seating/components/SeatingAreaTable.tsx
"use client";

import { Table, Badge, Text, Center, Loader, ActionIcon, Group, Tooltip, Switch } from "@mantine/core";
import { SeatingArea, SeatingAreaType, Prisma } from "@prisma/client";
import { SeatingAreaWithVisitInfo } from "@/lib/types"; // Import type for occupancy
import { formatCurrency } from "@/lib/utils"; // Adjust path if needed
import { Pencil, Trash, QrCode } from "lucide-react";
import React from "react"; // Needed for ReactNode

// Define props including handlers for edit and delete
type SeatingAreaTableProps = {
  areas: SeatingAreaWithVisitInfo[]; // Use the type with visit info
  loading: boolean;
  onEdit: (area: SeatingAreaWithVisitInfo) => void;
  onDelete: (area: SeatingAreaWithVisitInfo) => void;
  onToggleActive?: (area: SeatingAreaWithVisitInfo, isActive: boolean) => void; // Optional: For quick toggle
};

export function SeatingAreaTable({
  areas,
  loading,
  onEdit,
  onDelete,
  onToggleActive
}: SeatingAreaTableProps) {

  // Function to render the occupancy badge based on area status and visits
  const getOccupancyBadge = (area: SeatingAreaWithVisitInfo): React.ReactNode => {
      if (!area.isActive) {
          return <Badge color="gray" variant="outline">Inativa</Badge>;
      }
      // Check if visits array exists and has entries
      if (area.visits && area.visits.length > 0 && area.visits[0]) {
           const clientName = area.visits[0].client?.name || `Cliente #${area.visits[0].clientId || '?'}`;
          return <Badge color="red" variant="filled">Ocupada ({clientName})</Badge>;
      }
      return <Badge color="green" variant="light">Livre</Badge>;
  };

  const rows = areas.map((item) => (
    <Table.Tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.5 }}>
      <Table.Td>
        <Text fw={500}>{item.name}</Text>
        <Text size="xs" c="dimmed">ID: {item.id}</Text>
      </Table.Td>
      <Table.Td>
        {getOccupancyBadge(item)}
      </Table.Td>
      <Table.Td>
        {/* Format enum value for readability */}
        <Badge variant="outline" color="blue">
            {item.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
        </Badge>
      </Table.Td>
      <Table.Td>
        {/* Display capacity or N/A */}
        <Text>{item.capacity ?? 'N/A'}</Text>
      </Table.Td>
      <Table.Td>
         {/* Convert Decimal before formatting, handle null/undefined */}
        <Text>{formatCurrency(Number(item.reservationCost ?? 0))}</Text>
      </Table.Td>
      <Table.Td>
        {/* Show QR Token in a tooltip for easy copying */}
        <Tooltip label={item.qrCodeToken ?? "N/A"} position="top-start" withArrow multiline w={220}>
            <ActionIcon variant="subtle" color="gray" /* onClick={() => showQrModal(item)} */ >
                <QrCode size={18} />
            </ActionIcon>
        </Tooltip>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {/* Only render Switch if handler is provided and user has permission */}
          {onToggleActive && (
             <Tooltip label={item.isActive ? "Desativar" : "Ativar"} withArrow position="left">
                 <Switch
                     size="sm"
                     checked={item.isActive}
                     onChange={(event) => onToggleActive(item, event.currentTarget.checked)}
                     aria-label={item.isActive ? `Desativar ${item.name}` : `Ativar ${item.name}`}
                     />
             </Tooltip>
          )}
          <Tooltip label="Editar" withArrow position="left">
            <ActionIcon variant="light" color="blue" onClick={() => onEdit(item)}>
              <Pencil size={16} />
            </ActionIcon>
          </Tooltip>
           <Tooltip label="Excluir (Marcar como Inativa)" withArrow position="right">
            <ActionIcon variant="light" color="red" onClick={() => onDelete(item)}>
              <Trash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome / ID</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Capacidade</Table.Th>
            <Table.Th>Custo Reserva (R$)</Table.Th>
            <Table.Th>QR Token</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={7}> {/* Ensure colSpan matches number of columns */}
                <Center h={200}>
                  <Loader color="pastelGreen" /> {/* Use theme color */}
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={7}> {/* Ensure colSpan matches number of columns */}
                <Text ta="center" c="dimmed" py="lg">
                  Nenhuma área de assento encontrada. Clique em "Adicionar Área" para começar.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}