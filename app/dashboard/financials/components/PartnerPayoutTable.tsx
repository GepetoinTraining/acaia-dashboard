// File: app/dashboard/financials/components/PartnerPayoutTable.tsx
"use client";

/* // --- COMMENT OUT START ---
import { Table, Button, Text, Center, Loader, Badge } from "@mantine/core";
// PartnerPayoutWithDetails does not exist in lib/types
// import { PartnerPayoutWithDetails } from "@/lib/types";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";
import { Prisma } from "@prisma/client"; // Import Prisma if needed for Decimal


// Define a placeholder type if PartnerPayoutWithDetails is truly removed
type PartnerPayoutWithDetails = any; // Placeholder


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
        // API route is likely commented out too
    //   const response = await fetch("/api/financials/partner", {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ payoutId }),
    //   });
    //   const result: ApiResponse = await response.json();
    //   if (!response.ok) throw new Error(result.error || "Falha ao pagar");

      notifications.show({
        title: "Sucesso! (Simulado)", // Indicate simulation
        message: "Pagamento de parceiro marcado como pago.",
        color: "green",
      });
      onSuccess(); // Refresh the table (though data source is likely gone)
    } catch (error: any) {
      notifications.show({ title: "Erro (Simulado)", message: error.message, color: "red" });
    } finally {
      setLoading((prev) => ({ ...prev, [payoutId]: false }));
    }
  };

  // Ensure payout structure matches expected fields or handle potential errors
  const rows = payouts?.map((item: any = {}) => ( // Add default empty object
    <Table.Tr key={item?.id || Math.random()}> // Use random key if id missing
      <Table.Td>
        {item?.createdAt ? dayjs(item.createdAt).format("DD/MM/YYYY") : 'N/A'}
      </Table.Td>
      <Table.Td>{item?.partner?.companyName || "N/A"}</Table.Td>
      <Table.Td>
        <Text>Venda do item: {item?.sale?.product?.name || "N/A"}</Text>
        <Text size="xs" c="dimmed">ID Venda: {item?.saleId || 'N/A'}</Text>
      </Table.Td>
      <Table.Td>
         {/* Safely access and format amountDue */}
        <Text fw={700}>R$ {Number(item?.amountDue || 0).toFixed(2)}</Text>
      </Table.Td>
      <Table.Td>
        <Button
          size="xs"
          color="green"
          onClick={() => handleMarkAsPaid(item?.id)}
          loading={loading[item?.id]}
          disabled={!item?.id} // Disable if no ID
        >
          Pagar
        </Button>
      </Table.Td>
    </Table.Tr>
  )) || []; // Handle payouts being null or undefined

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
                  Nenhum pagamento de parceiro pendente (Funcionalidade desativada).
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

*/ // --- COMMENT OUT END ---

// Add a placeholder export to prevent build errors about empty modules
export {};