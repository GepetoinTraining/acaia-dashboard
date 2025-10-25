// File: app/dashboard/financials/components/StaffPayoutTable.tsx
"use client";

import { Table, Button, Text, Center, Loader, Badge } from "@mantine/core";
import { StaffCommissionWithDetails } from "@/lib/types"; // Ensure this type matches the simplified data
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/lib/utils"; // Import formatCurrency

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

  // Ensure commission structure matches expected fields or handle potential errors
  const rows = commissions?.map((item: StaffCommissionWithDetails) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        {dayjs(item.createdAt).format("DD/MM/YYYY")}
      </Table.Td>
      <Table.Td>{item.staff?.name || 'Staff Desconhecido'}</Table.Td>
      <Table.Td>
        {/* --- FIX: Removed conditional color logic --- */}
        <Badge color="blue" variant="light"> {/* Use a consistent color */}
          {item.commissionType} {/* Should always be 'sale' now */}
        </Badge>
      </Table.Td>
      <Table.Td>
        {/* Safely access and format amountEarned */}
        <Text fw={700}>{formatCurrency(Number(item.amountEarned || 0))}</Text>
      </Table.Td>
      <Table.Td>{item.notes || "N/A"}</Table.Td>
      <Table.Td>
        <Button
          size="xs"
          color="green"
          onClick={() => handleMarkAsPaid(item.id)}
          loading={loading[item.id]}
          disabled={!item.id} // Disable if no ID
        >
          Pagar
        </Button>
      </Table.Td>
    </Table.Tr>
  )) || []; // Handle commissions being null or undefined


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
           {/* Add loading state handling */}
           {loading ? (
                <Table.Tr>
                    <Table.Td colSpan={6}>
                        <Center h={200}>
                            <Loader color="pastelGreen" />
                        </Center>
                    </Table.Td>
                </Table.Tr>
           ) : rows.length > 0 ? (
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