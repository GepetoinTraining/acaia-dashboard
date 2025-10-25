"use client";

import {
  Modal,
  Button,
  Stack,
  LoadingOverlay,
  Text,
  Group,
  Divider,
} from "@mantine/core";
import { useState } from "react";
import { ApiResponse, CartItem, LiveClient, LiveHostess, SalePayload } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type CheckoutModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: LiveClient;
  hostess: LiveHostess | null;
  cart: CartItem[];
  total: number;
};

export function CheckoutModal({
  opened,
  onClose,
  onSuccess,
  client,
  hostess,
  cart,
  total,
}: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);

  // Calculate payment
  const creditToUse = Math.min(client.consumableCreditRemaining, total);
  const cashToCharge = total - creditToUse;

  const handleSubmit = async () => {
    if (!hostess) {
      notifications.show({
        title: "Erro",
        message: "Nenhuma hostess selecionada.",
        color: "red",
      });
      return;
    }
    
    setLoading(true);

    const payload: SalePayload = {
      visitId: client.visitId,
      hostId: hostess.hostId,
      cart: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao registrar venda");

      notifications.show({
        title: "Venda Registrada!",
        message: `Venda de R$ ${total.toFixed(2)} registrada para ${client.name}.`,
        color: "green",
      });
      onSuccess(); // Resets the POS page
    } catch (error: any) {
      notifications.show({
        title: "Erro",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Confirmar Venda"
      centered
      size="md"
    >
      <LoadingOverlay visible={loading} />
      <Stack gap="sm">
        <Text>
          Cliente: <Text component="span" fw={700}>{client.name || "Anônimo"}</Text>
        </Text>
        <Text>
          Hostess: <Text component="span" fw={700}>{hostess?.stageName}</Text>
        </Text>
        
        <Divider my="sm" />
        
        <Group justify="space-between">
          <Text size="lg">Total do Pedido:</Text>
          <Text size="lg" fw={700}>R$ {total.toFixed(2)}</Text>
        </Group>
        
        <Divider my="sm" label="Detalhes do Pagamento" />

        <Group justify="space-between">
          <Text c="green.7">Usando Crédito:</Text>
          <Text c="green.7" fw={500}>- R$ {creditToUse.toFixed(2)}</Text>
        </Group>
        <Group justify="space-between">
          <Text size="xl" fw={700}>Total a Cobrar:</Text>
          <Text size="xl" fw={700} c="privacyGold.9">
            R$ {cashToCharge.toFixed(2)}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          O sistema usará R$ {creditToUse.toFixed(2)} do crédito de R$ {client.consumableCreditRemaining.toFixed(2)} do cliente.
        </Text>

        <Button
          type="button"
          mt="md"
          color="green"
          size="lg"
          loading={loading}
          onClick={handleSubmit}
        >
          Confirmar Venda e Cobrar R$ {cashToCharge.toFixed(2)}
        </Button>
      </Stack>
    </Modal>
  );
}
