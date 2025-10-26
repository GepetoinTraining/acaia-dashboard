// PATH: app/dashboard/inventory/components/CreateIngredientModal.tsx
// NOTE: This is a NEW FILE in a NEW FOLDER.

"use client";

import { useState } from "react";
import {
  Modal,
  TextInput,
  Button,
  NumberInput,
  Stack,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ApiResponse } from "@/lib/types";

interface CreateIngredientModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateIngredientModal({
  opened,
  onClose,
  onSuccess,
}: CreateIngredientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      unit: "",
      costPerUnit: 0,
      stock: 0,
    },
    validate: {
      name: (value) =>
        value.trim().length < 2 ? "Nome deve ter pelo menos 2 caracteres" : null,
      unit: (value) => (value.trim().length > 0 ? null : "Unidade é obrigatória"),
      costPerUnit: (value) =>
        value <= 0 ? "Custo deve ser maior que zero" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          // Send as strings to be parsed by Decimal on server
          costPerUnit: values.costPerUnit.toString(),
          stock: values.stock.toString(),
        }),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        notifications.show({
          title: "Sucesso",
          message: "Ingrediente criado com sucesso!",
          color: "green",
        });
        form.reset();
        onSuccess();
      } else {
        notifications.show({
          title: "Erro",
          message: data.error || "Falha ao criar ingrediente",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      notifications.show({
        title: "Erro",
        message: "Ocorreu um erro inesperado",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Novo Ingrediente">
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome do Ingrediente"
            placeholder="Ex: Vodka Absolut"
            {...form.getInputProps("name")}
          />
          <TextInput
            required
            label="Unidade de Medida"
            placeholder="Ex: 'Dose (50ml)', 'Garrafa (1L)', 'Unidade'"
            {...form.getInputProps("unit")}
          />
          <NumberInput
            required
            label="Custo por Unidade (R$)"
            placeholder="5.50"
            decimalScale={2}
            fixedDecimalScale
            min={0.01}
            {...form.getInputProps("costPerUnit")}
          />
          <NumberInput
            label="Estoque Inicial (Opcional)"
            placeholder="0"
            decimalScale={3} // Allow for fractional units (e.g., kg)
            min={0}
            {...form.getInputProps("stock")}
          />
          <Button type="submit" mt="md">
            Salvar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}