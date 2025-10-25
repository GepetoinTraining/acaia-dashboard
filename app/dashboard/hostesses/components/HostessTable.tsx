"use client";

import { Table, Badge, Text, Center, Loader, Anchor } from "@mantine/core";
// Import HostStatus from Prisma Client
import { Host, HostStatus } from "@prisma/client";
import dayjs from "dayjs";
import Link from "next/link";

type HostessTableProps = {
  hostesses: Host[];
  loading: boolean;
};

const statusColors: Record<HostStatus, string> = {
  new: "gray",
  rising_star: "blue",
  top_performer: "green",
  on_probation: "orange",
};

export function HostessTable({ hostesses, loading }: HostessTableProps) {
  const rows = hostesses.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Anchor
          component={Link}
          href={`/dashboard/hostesses/${item.id}`}
          fw={500}
        >
          {item.stageName}
        </Anchor>
      </Table.Td>
      <Table.Td>
        <Badge color={statusColors[item.status]} variant="light">
          {item.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        {/* Safely convert baseRate (Decimal | null) to string */}
        <Text>R$ {item.baseRate ? Number(item.baseRate).toFixed(2) : "N/A"}</Text>
      </Table.Td>
      <Table.Td>
         {/* Convert commissionRate (Decimal) to number before multiplying */}
        <Text>{(Number(item.commissionRate) * 100).toFixed(0)}%</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {dayjs(item.createdAt).format("DD/MM/YYYY")}
        </Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome de Palco</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Taxa Base (R$)</Table.Th>
            <Table.Th>Comissão</Table.Th>
            <Table.Th>Registrada em</Table.Th>
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
                  Nenhuma hostess cadastrada.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
