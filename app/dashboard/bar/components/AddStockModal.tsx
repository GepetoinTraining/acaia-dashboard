"use client";

import {
  Modal,
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
  NumberInput,
  Text,
  Title,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { InventoryItem, StockMovementType } from "@prisma/client";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type AddStockModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
};

export function AddStockModal({
  opened,
  onClose,
  onSuccess,
  item,
}: AddStockModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      quantity: 1, // Quantity in *storage units* (e.g., 10 garrafas)
      notes: "",
      movementType: StockMovementType.purchase,
    },
    validate: {
      quantity: (val) => (val <= 0 ? "Quantidade deve ser positiva" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    const payload = {
      inventoryItemId: item.id,
      quantityInStorageUnits: values.quantity, // e.g., 10 garrafas
      movementType: values.movementType,
      notes: values.notes,
    };

    try {
      const response = await fetch("/api/inventory", {
        method: "PATCH", // PATCH to /api/inventory will add stock
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao adicionar estoque");

      notifications.show({
        title: "Sucesso!",
        message: `Estoque de "${item.name}" atualizado.`,
        color: "green",
      });
      onSuccess();
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

const totalSmallestUnits =
    (Number(item.storageUnitSizeInSmallest) || 1) * form.values.quantity;

  return (
    <Modal opened={opened} onClose={onClose} title="Adicionar Estoque" centered>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Title order={4}>{item.name}</Title>
          <Select
            label="Tipo de Movimentação"
            data={[
              { label: "Compra (Entrada)", value: StockMovementType.purchase },
              {
                label: "Consignado (Entrada)",
                value: StockMovementType.consignment_stock_in,
              },
              { label: "Desperdício (Saída)", value: StockMovementType.waste },
              {
                label: "Ajuste Manual (Saída)",
                value: StockMovementType.adjustment,
              },
            ]}
            {...form.getInputProps("movementType")}
          />
          <NumberInput
            required
            label={`Quantidade (em ${item.storageUnitName})`}
            placeholder="Ex: 10"
            min={1}
            {...form.getInputProps("quantity")}
          />
          <Text c="dimmed" size="sm">
            Total a ser adicionado: {totalSmallestUnits.toLocaleString("pt-BR")}{" "}
            {item.smallestUnit}
          </Text>
          <TextInput label="Notas" placeholder="Ex: Pedido #12345" {...form.getInputProps("notes")} />
          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Registrar Movimentação
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
