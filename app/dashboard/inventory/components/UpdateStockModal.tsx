// PATH: app/dashboard/inventory/components/UpdateStockModal.tsx
// NOTE: This is a NEW FILE in a NEW FOLDER.

"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  NumberInput,
  Stack,
  LoadingOverlay,
  Text,
  SegmentedControl,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ApiResponse } from "@/lib/types";
import { SerializedIngredient } from "../page";

interface UpdateStockModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredient: SerializedIngredient | null;
}

type Action = "ADD" | "REMOVE";

export function UpdateStockModal({
  opened,
  onClose,
  onSuccess,
  ingredient,
}: UpdateStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<Action>("ADD");

  const form = useForm({
    initialValues: {
      amount: 0,
    },
    validate: {
      amount: (value) => (value <= 0 ? "Quantidade deve ser positiva" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!ingredient) return;

    setIsSubmitting(true);
    // If action is "REMOVE", send a negative number
    const amountToSend = action === "ADD" ? values.amount : -values.amount;

    try {
      const response = await fetch("/api/ingredients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ingredient.id,
          amount: amountToSend.toString(), // Send as string
        }),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        notifications.show({
          title: "Sucesso",
          message: "Estoque atualizado com sucesso!",
          color: "green",
        });
        form.reset();
        onSuccess();
      } else {
        notifications.show({
          title: "Erro",
          message: data.error || "Falha ao atualizar estoque",
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

  if (!ingredient) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Ajustar Estoque: ${ingredient.name}`}
    >
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Text>
            Estoque Atual:{" "}
            <Text span fw={700}>
              {ingredient.stock} {ingredient.unit}
            </Text>
          </Text>
          <SegmentedControl
            fullWidth
            value={action}
            onChange={(val) => setAction(val as Action)}
            data={[
              { label: "Adicionar Estoque", value: "ADD" },
              { label: "Remover Estoque", value: "REMOVE" },
            ]}
            color={action === "ADD" ? "green" : "red"}
          />
          <NumberInput
            required
            label={`Quantidade a ${
              action === "ADD" ? "Adicionar" : "Remover"
            }`}
            placeholder="0"
            decimalScale={3}
            min={0}
            {...form.getInputProps("amount")}
          />
          <Button
            type="submit"
            mt="md"
            color={action === "ADD" ? "green" : "red"}
          >
            Confirmar Ajuste
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}