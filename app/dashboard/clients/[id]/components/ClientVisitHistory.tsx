// File: app/dashboard/clients/[id]/components/ClientVisitHistory.tsx
"use client";

import {
  Paper,
  Title,
  Text,
  Stack,
  Accordion,
  ThemeIcon,
  Group,
  Table,
} from "@mantine/core";
// --- FIX: Import the correct type alias ---
import { VisitWithSalesAndArea } from "@/lib/types"; // Corrected import path
import { Calendar, ShoppingBag, User, DollarSign } from "lucide-react";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/utils"; // Import formatCurrency

type ClientVisitHistoryProps = {
  // --- FIX: Use the correct type alias ---
  visits: VisitWithSalesAndArea[];
};

export function ClientVisitHistory({ visits }: ClientVisitHistoryProps) {
  if (!visits || visits.length === 0) { // Added null check for safety
    return (
      <Paper withBorder p="md" radius="md" mt="md"> {/* Added margin top */}
        <Title order={4}>Histórico de Visitas</Title>
        <Text c="dimmed" mt="md">
          Este cliente ainda não tem visitas registradas.
        </Text>
      </Paper>
    );
  }

  const items = visits.map((visit) => {
    // Calculate visit total using the correct structure and Number()
    const visitTotal = visit.sales.reduce(
      (acc, sale) => acc + (Number(sale.totalAmount) || 0), // Use totalAmount, ensure number
      0
    );

    const salesRows = visit.sales.map((sale) => (
      <Table.Tr key={sale.id}>
        <Table.Td>
          {dayjs(sale.createdAt).format("HH:mm")}
        </Table.Td>
        <Table.Td>{sale.product?.name || "Produto Deletado"}</Table.Td>
        <Table.Td>{sale.quantity}</Table.Td>
        {/* Use formatCurrency for price */}
        <Table.Td>{formatCurrency(Number(sale.priceAtSale) || 0)}</Table.Td>
        {/* Use totalAmount */}
        <Table.Td>{formatCurrency(Number(sale.totalAmount) || 0)}</Table.Td>
        {/* Display staff name */}
        <Table.Td>{sale.staff?.name || "N/A"}</Table.Td>
      </Table.Tr>
    ));

    return (
      <Accordion.Item key={visit.id} value={visit.id.toString()}>
        <Accordion.Control>
          <Group justify="space-between">
             <Group>
                <ThemeIcon color="pastelGreen" variant="light"> {/* Use theme color */}
                  <Calendar size={16} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text fw={500}>
                    {dayjs(visit.entryTime).format("DD/MM/YYYY [às] HH:mm")}
                    {visit.exitTime ? ` - ${dayjs(visit.exitTime).format("HH:mm")}` : ' (Ativa)'}
                  </Text>
                  <Text size="sm" c="dimmed">
                     {/* Display formatted total and sale count */}
                    Total Gasto: {formatCurrency(visitTotal)} • {visit.sales.length}{" "}
                    item(s)
                  </Text>
                   {/* Display Seating Area */}
                   {visit.seatingArea && (
                       <Text size="xs" c="dimmed">
                           Mesa/Área: {visit.seatingArea.name}
                       </Text>
                   )}
                </Stack>
             </Group>
             {/* Optionally show total directly on control */}
              <Text fw={500} mr="md">{formatCurrency(visitTotal)}</Text>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
           {salesRows.length > 0 ? (
               <Table.ScrollContainer minWidth={600}>
                 <Table striped withTableBorder>
                   <Table.Thead>
                     <Table.Tr>
                       <Table.Th>Hora</Table.Th>
                       <Table.Th>Produto</Table.Th>
                       <Table.Th>Qtd.</Table.Th>
                       <Table.Th>Preço Unit.</Table.Th>
                       <Table.Th>Total Item</Table.Th>
                       <Table.Th>Staff</Table.Th> {/* Changed from Hostess */}
                     </Table.Tr>
                   </Table.Thead>
                   <Table.Tbody>{salesRows}</Table.Tbody>
                 </Table>
               </Table.ScrollContainer>
           ) : (
                <Text size="sm" c="dimmed" ta="center" my="sm">Nenhuma compra registrada nesta visita.</Text>
           )}
        </Accordion.Panel>
      </Accordion.Item>
    );
  });

  return (
    <Paper withBorder p="md" radius="md" mt="md"> {/* Added margin top */}
      <Title order={4}>Histórico de Visitas ({visits.length})</Title>
      <Accordion chevronPosition="left" variant="contained" mt="md">
        {items}
      </Accordion>
    </Paper>
  );
}