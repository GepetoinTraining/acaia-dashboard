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
// Removed incorrect import from "../page"
import { VisitWithSales } from "@/lib/types"; // Corrected import path
import { Calendar, ShoppingBag, User, DollarSign } from "lucide-react";
import dayjs from "dayjs";

type ClientVisitHistoryProps = {
  // Use the correctly imported type
  visits: VisitWithSales[];
};

export function ClientVisitHistory({ visits }: ClientVisitHistoryProps) {
  if (visits.length === 0) {
    return (
      <Paper withBorder p="md" radius="md">
        <Title order={4}>Histórico de Visitas</Title>
        <Text c="dimmed" mt="md">
          Este cliente ainda não tem visitas registradas.
        </Text>
      </Paper>
    );
  }

  const items = visits.map((visit) => {
    const visitTotal = visit.sales.reduce(
      (acc, sale) => acc + (Number(sale.priceAtSale) * sale.quantity), // Convert Decimal priceAtSale
      0
    );

    const salesRows = visit.sales.map((sale) => (
      <Table.Tr key={sale.id}>
        <Table.Td>
          {dayjs(sale.createdAt).format("HH:mm")}
        </Table.Td>
        <Table.Td>{sale.product?.name || "Produto Deletado"}</Table.Td>
        <Table.Td>{sale.quantity}</Table.Td>
        <Table.Td>R$ {Number(sale.priceAtSale).toFixed(2)}</Table.Td> {/* Convert Decimal priceAtSale */}
        <Table.Td>{sale.host?.stageName || "N/A"}</Table.Td>
      </Table.Tr>
    ));

    return (
      <Accordion.Item key={visit.id} value={visit.id.toString()}>
        <Accordion.Control>
          <Group>
            <ThemeIcon color="privacyGold" variant="light">
              <Calendar size={16} />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={500}>
                {dayjs(visit.entryTime).format("DD/MM/YYYY [às] HH:mm")}
              </Text>
              <Text size="sm" c="dimmed">
                Total Gasto: R$ {visitTotal.toFixed(2)} • {visit.sales.length}{" "}
                compras
              </Text>
            </Stack>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Table.ScrollContainer minWidth={500}>
            <Table striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hora</Table.Th>
                  <Table.Th>Produto</Table.Th>
                  <Table.Th>Qtd.</Table.Th>
                  <Table.Th>Valor (R$)</Table.Th>
                  <Table.Th>Hostess</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{salesRows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Accordion.Panel>
      </Accordion.Item>
    );
  });

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4}>Histórico de Visitas</Title>
      <Accordion chevronPosition="left" variant="contained" mt="md">
        {items}
      </Accordion>
    </Paper>
  );
}