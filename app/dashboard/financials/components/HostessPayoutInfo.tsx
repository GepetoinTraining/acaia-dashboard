"use client";

// Change HostessPayout to HostessPayoutSummary
import { HostessPayoutSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Table, Text, Title } from "@mantine/core";

type HostessPayoutInfoProps = {
  // Update the type here as well
  data: HostessPayoutSummary[];
};

// Update the type in the function signature
export function HostessPayoutInfo({ data }: HostessPayoutInfoProps) {
  const rows = data.map((row) => (
    <Table.Tr key={row.hostId}>
      <Table.Td>
        <Text fz="sm" fw={500}>
          {row.stageName}
        </Text>
        <Text fz="xs" c="dimmed">
          ID: {row.hostId}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fz="sm" fw={500} c="green">
          {/* Ensure conversion to number before formatting */}
          {formatCurrency(Number(row.totalUnpaidCommissions))}
        </Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Title order={4} mt="xl" mb="md">
        Comissões de Hostess (Não Pagas)
      </Title>
      <Text c="dimmed" fz="sm" mb="md">
        Este é um resumo de todas as comissões não pagas. (A lógica de
        "fechamento de turno" ainda será implementada).
      </Text>
      <Table.ScrollContainer minWidth={300}>
        <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Hostess</Table.Th>
              <Table.Th>Total Devido</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={2}>
                  <Text c="dimmed" ta="center">
                    Nenhuma comissão pendente.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}
