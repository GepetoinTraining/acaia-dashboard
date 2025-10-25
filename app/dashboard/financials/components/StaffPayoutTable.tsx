"use client";

import { Table, Button, Text, Center, Loader, Badge } from "@mantine/core";
import { StaffCommissionWithDetails } from "@/lib/types";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";

type StaffPayoutTableProps = {
  commissions: StaffCommissionWithDetails[];
  onSuccess: () => void;
};

export function StaffPayoutTable({
  commissions,
  onSuccess,
}: StaffPayoutTableProps) {
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const handleMarkAsPaid = async (commissionId: number) => {
    setLoading((prev) => ({ ...prev, [commissionId]: true }));
    try {
      const response = await fetch("/api/financials/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionId }),
      });
      const result: ApiResponse = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao pagar");

      notifications.show({
        title: "Sucesso!",
        message: "Comissão marcada como paga.",
        color: "green",
      });
      onSuccess(); // Refresh the table
    } catch (error: any) {
      notifications.show({ title: "Erro", message: error.message, color: "red" });
    } finally {
      setLoading((prev) => ({ ...prev, [commissionId]: false }));
    }
  };

  const rows = commissions.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        {dayjs(item.createdAt).format("DD/MM/YYYY")}
      </Table.Td>
      <Table.Td>{item.staff.name}</Table.Td>
      <Table.Td>
        <Badge color={item.commissionType === 'cac_bonus' ? 'blue' : 'gray'}>
          {item.commissionType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text fw={700}>R$ {item.amountEarned.toFixed(2)}</Text>
      </Table.Td>
      <Table.Td>{item.notes}</Table.Td>
      <Table.Td>
        <Button
          size="xs"
          color="green"
          onClick={() => handleMarkAsPaid(item.id)}
          loading={loading[item.id]}
        >
          Pagar
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Staff</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Valor (R$)</Table.Th>
            <Table.Th>Notas</Table.Th>
            <Table.Th>Ação</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text ta="center" c="dimmed" py="lg">
                  Nenhuma comissão de staff pendente.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
