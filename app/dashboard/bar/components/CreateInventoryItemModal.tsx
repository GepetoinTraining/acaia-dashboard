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
// --- FIX: Import UnitOfMeasure instead of SmallestUnit ---
import { InventoryItem, UnitOfMeasure } from "@prisma/client";
import { useState } from "react";
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
      // --- FIX: Use UnitOfMeasure ---
      smallestUnit: UnitOfMeasure.unit, // Default to 'unit'
      storageUnitSize: 1,
      reorderThreshold: 0,
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      storageUnitName: (val) => (val.trim().length < 2 ? "Nome inválido (opcional, mas se preenchido deve ser válido)" : null), // Adjusted validation slightly
      storageUnitSize: (val) => (val === null || val === undefined || Number(val) <= 0 ? "Tamanho deve ser positivo" : null), // Added null/undefined check
      // --- FIX: Add validation for smallestUnit ---
      smallestUnit: (val) => (Object.values(UnitOfMeasure).includes(val) ? null : "Unidade inválida"),
      reorderThreshold: (val) => (val === null || val === undefined || Number(val) < 0 ? "Nível de alerta não pode ser negativo" : null), // Allow 0
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
        // Prepare payload, ensuring numbers are correctly formatted
        const payload = {
            ...values,
            storageUnitSize: Number(values.storageUnitSize) || 1, // Ensure it's a number, default 1
            reorderThreshold: Number(values.reorderThreshold) ?? null, // Ensure number or null
        };

      const response = await fetch("/api/inventory", { // This POST hits the inventory item creation endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send validated payload
      });

      const result: ApiResponse<InventoryItem> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar item");

      notifications.show({
        title: "Sucesso!",
        message: `Item "${values.name}" definido.`,
        color: "green",
      });
      onSuccess(); // Closes modal and refreshes parent data
      form.reset(); // Reset form on success
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
            // Removed required, make it optional as per schema
            label="Unidade de Armazenagem / Compra (Opcional)"
            placeholder="Ex: Saco 1kg, Garrafa 750ml, Lata 350ml, Unidade"
            {...form.getInputProps("storageUnitName")}
          />
          <Group grow>
            <Select
              required
              label="Menor Unidade de Medida/Venda"
              // --- FIX: Use UnitOfMeasure ---
              data={Object.values(UnitOfMeasure).map((unit) => ({
                label: unit, // Use enum value directly for label and value
                value: unit,
              }))}
              {...form.getInputProps("smallestUnit")}
            />
            <NumberInput
              required
              label="Tamanho da Unid. Armazenagem (em Menor Unidade)"
              description={`Quantos ${form.values.smallestUnit} cabem na Unid. Armazenagem? Ex: 1000 (para 1kg em gramas), 750 (para garrafa em ml), 1 (para unidade)`}
              min={0.01} // Cannot be zero or less
              step={1} // Default step
              decimalScale={2} // Allow decimals if needed (e.g., 0.5 doses?)
              {...form.getInputProps("storageUnitSize")}
            />
          </Group>
          <NumberInput
            label="Nível de Alerta de Estoque (Opcional)"
            description={`Mostrar alerta quando estoque (em ${form.values.smallestUnit}) for <= a este número`}
            min={0}
            step={1}
            allowDecimal={false} // Usually whole units for threshold
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