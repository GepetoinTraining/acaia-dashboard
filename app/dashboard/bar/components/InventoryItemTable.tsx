// File: app/dashboard/bar/components/CreateInventoryItemModal.tsx
"use client";

import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  LoadingOverlay,
  NumberInput,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { InventoryItem, UnitOfMeasure } from "@prisma/client";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type CreateItemModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateInventoryItemModal({
  opened,
  onClose,
  onSuccess,
}: CreateItemModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      storageUnitName: "",
      smallestUnit: UnitOfMeasure.unit,
      storageUnitSize: 1,
      // Initialize reorderThreshold as potentially empty string for NumberInput compatibility
      reorderThreshold: '' as number | string | null, // Allow empty string initially
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      // Allow storageUnitName to be empty or valid
      storageUnitName: (val) => (val && val.trim().length > 0 && val.trim().length < 2 ? "Nome da unidade inválido" : null),
      storageUnitSize: (val) => (val === null || val === undefined || Number(val) <= 0 ? "Tamanho deve ser positivo" : null),
      smallestUnit: (val) => (Object.values(UnitOfMeasure).includes(val) ? null : "Unidade inválida"),
      // Validate reorderThreshold ensuring it's a non-negative number if provided
       reorderThreshold: (val) => {
           if (val === '' || val === null || val === undefined) return null; // Allow empty/null
           const num = Number(val);
           return isNaN(num) || num < 0 ? "Nível de alerta não pode ser negativo" : null;
       },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
        // --- FIX: Refined reorderThreshold handling ---
        // Convert to number, treat 0, null, undefined, NaN as null for the database
        const thresholdValue = Number(values.reorderThreshold);
        const reorderThresholdForDb = (!isNaN(thresholdValue) && thresholdValue > 0) ? thresholdValue : null;
        // --- End Fix ---

        const payload = {
            name: values.name,
            storageUnitName: values.storageUnitName?.trim() || null, // Ensure null if empty/whitespace only
            smallestUnit: values.smallestUnit,
            storageUnitSize: Number(values.storageUnitSize) || 1, // Ensure it's a number, default 1
            reorderThreshold: reorderThresholdForDb, // Use the processed value
        };

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<InventoryItem> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar item");

      notifications.show({
        title: "Sucesso!",
        message: `Item "${values.name}" definido.`,
        color: "green",
      });
      onSuccess();
      form.reset();
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

   // Reset form when modal is closed
   useEffect(() => {
       if (!opened) {
           form.reset();
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Definir Novo Item de Inventário"
      centered
      size="lg"
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome do Item"
            placeholder="Ex: Café em Grãos Acaia, Vodka Absolut"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Unidade de Armazenagem / Compra (Opcional)"
            placeholder="Ex: Saco 1kg, Garrafa 750ml, Lata 350ml, Unidade"
            {...form.getInputProps("storageUnitName")}
          />
          <Group grow>
            <Select
              required
              label="Menor Unidade de Medida/Venda"
              data={Object.values(UnitOfMeasure).map((unit) => ({
                label: unit,
                value: unit,
              }))}
              {...form.getInputProps("smallestUnit")}
            />
            <NumberInput
              required
              label="Tamanho da Unid. Armazenagem (em Menor Unidade)"
              description={`Quantos ${form.values.smallestUnit} cabem na Unid. Armazenagem? Ex: 1000 (para 1kg em gramas), 750 (para garrafa em ml), 1 (para unidade)`}
              min={0.01}
              step={1}
              decimalScale={2}
              {...form.getInputProps("storageUnitSize")}
            />
          </Group>
          <NumberInput
            label="Nível de Alerta de Estoque (Opcional, em Menor Unidade)"
            description={`Mostrar alerta quando estoque (em ${form.values.smallestUnit}) for <= a este número`}
            min={0} // Allow 0
            step={1}
            allowDecimal={false} // Thresholds are typically whole numbers
            // Allow empty input
            {...form.getInputProps("reorderThreshold")}
          />

          <Button type="submit" mt="md" color="pastelGreen" loading={loading}>
            Salvar Item
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}