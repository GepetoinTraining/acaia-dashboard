"use client";

import { Table, Button, Text, Center, Loader, Badge } from "@mantine/core";
import { PartnerPayoutWithDetails } from "@/lib/types";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";

type PartnerPayoutTableProps = {
  payouts: PartnerPayoutWithDetails[];
  onSuccess: () => void;
};

export function PartnerPayoutTable({
  payouts,
  onSuccess,
}: PartnerPayoutTableProps) {
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const handleMarkAsPaid = async (payoutId: number) => {
    setLoading((prev) => ({ ...prev, [payoutId]: true }));
    try {
      const response = await fetch("/api/financials/partner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId }),
      });
      const result: ApiResponse = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao pagar");

      notifications.show({
        title: "Sucesso!",
        message: "Pagamento de parceiro marcado como pago.",
        color: "green",
      });
      onSuccess(); // Refresh the table
    } catch (error: any) {
      notifications.show({ title: "Erro", message: error.message, color: "red" });
    } finally {
      setLoading((prev) => ({ ...prev, [payoutId]: false }));
    }
  };

  const rows = payouts.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        {dayjs(item.createdAt).format("DD/MM/YYYY")}
      </Table.Td>
      <Table.Td>{item.partner.companyName}</Table.Td>
      <Table.Td>
        <Text>Venda do item: {item.sale.product.name}</Text>
        <Text size="xs" c="dimmed">ID Venda: {item.saleId}</Text>
      </Table.Td>
      <Table.Td>
        <Text fw={700}>R$ {item.amountDue.toFixed(2)}</Text>
      </Table.Td>
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
            <Table.Th>Parceiro</Table.Th>
            <Table.Th>Origem</Table.Th>
            <Table.Th>Valor (R$)</Table.Th>
            <Table.Th>Ação</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text ta="center" c="dimmed" py="lg">
                  Nenhum pagamento de parceiro pendente.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
