"use client";

import { Table, Text, Center, Loader, Anchor } from "@mantine/core";
import { Partner } from "@prisma/client";
import dayjs from "dayjs";
import Link from "next/link";

type PartnerTableProps = {
  partners: Partner[];
  loading: boolean;
};

export function PartnerTable({ partners, loading }: PartnerTableProps) {
  const rows = partners.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        {/* TODO: Link to partner detail page */}
        <Text fw={500}>{item.companyName}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{item.contactPerson || "N/A"}</Text>
      </Table.Td>
      <Table.Td>
        <Text c="dimmed">{item.contactPhone || "N/A"}</Text>
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
            <Table.Th>Empresa</Table.Th>
            <Table.Th>Contato</Table.Th>
            <Table.Th>Telefone</Table.Th>
            <Table.Th>Desde</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Center h={200}>
                  <Loader color="privacyGold" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text ta="center" c="dimmed" py="lg">
                  Nenhum parceiro cadastrado.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
