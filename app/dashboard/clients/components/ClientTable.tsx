"use client";

import { Table, Badge, Text, Center, Loader, Anchor } from "@mantine/core";
import { Client, ClientStatus } from "@prisma/client";
import dayjs from "dayjs";
import Link from "next/link";

type ClientTableProps = {
  clients: Client[];
  loading: boolean;
};

const statusColors: Record<ClientStatus, string> = {
  new: "gray",
  regular: "blue",
  vip: "privacyGold",
  whale: "grape",
};

export function ClientTable({ clients, loading }: ClientTableProps) {
  const rows = clients.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Anchor
          component={Link}
          href={`/dashboard/clients/${item.id}`}
          fw={500}
        >
          {item.name || "Anônimo"}
        </Anchor>
        <Text size="xs" c="dimmed">
          {item.phoneNumber || "Sem telefone"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge color={statusColors[item.status]} variant="light">
          {item.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text>R$ {item.avgSpendPerVisit.toFixed(2)}</Text>
      </Table.Td>
      <Table.Td>
        <Text fw={500}>R$ {item.lifetimeSpend.toFixed(2)}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{item.totalVisits}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {item.lastVisitDate
            ? dayjs(item.lastVisitDate).format("DD/MM/YYYY")
            : "N/A"}
        </Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Cliente</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Gasto Médio (R$)</Table.Th>
            <Table.Th>Gasto Total (R$)</Table.Th>
            <Table.Th>Visitas</Table.Th>
            <Table.Th>Última Visita</Table.Th>
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
                  Nenhum cliente encontrado.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
