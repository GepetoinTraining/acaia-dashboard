// File: app/dashboard/pospage/components/SubmitOrderModal.tsx
"use client";

import {
  Modal,
  Button,
  Stack,
  LoadingOverlay,
  Text,
  Group,
  Divider,
  ScrollArea,
  Table
} from "@mantine/core";
import { useState } from "react";
import { CartItem } from "@/lib/types"; // Adjust path if needed
import { formatCurrency } from "@/lib/utils"; // Adjust path if needed

type SubmitOrderModalProps = {
  opened: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>; // Function to call when submitting
  seatingAreaName: string;
  clientName: string;
  cart: CartItem[];
  total: number;
  loading: boolean; // Loading state passed from parent
};

export function SubmitOrderModal({
  opened,
  onClose,
  onSubmit,
  seatingAreaName,
  clientName,
  cart,
  total,
  loading,
}: SubmitOrderModalProps) {

  const cartRows = cart.map((item) => (
    <Table.Tr key={item.product.id}>
      <Table.Td>{item.quantity}x</Table.Td>
      <Table.Td>{item.product.name}</Table.Td>
      <Table.Td ta="right">{formatCurrency(Number(item.product.salePrice) * item.quantity)}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Confirmar Pedido para ${seatingAreaName}`}
      centered
      size="md"
    >
      <LoadingOverlay visible={loading} />
      <Stack gap="sm">
        <Text>
          Mesa/Área: <Text component="span" fw={700}>{seatingAreaName}</Text>
        </Text>
        <Text size="sm">
          Cliente: <Text component="span" fw={700}>{clientName}</Text>
        </Text>

        <Divider my="sm" label="Itens do Pedido" />

        <ScrollArea h={200}>
            <Table>
                <Table.Tbody>{cartRows}</Table.Tbody>
            </Table>
        </ScrollArea>

        <Divider my="xs" />

        <Group justify="space-between">
          <Text size="lg" fw={700}>Total do Pedido:</Text>
          <Text size="lg" fw={700}> {formatCurrency(total)}</Text>
        </Group>

        <Button
          mt="md"
          color="green" // Or pastelGreen
          size="lg"
          loading={loading}
          onClick={onSubmit} // Call the passed onSubmit function
        >
          Enviar Pedido para Preparo
        </Button>
      </Stack>
    </Modal>
  );
}