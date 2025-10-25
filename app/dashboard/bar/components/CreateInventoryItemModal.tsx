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
import { InventoryItem, SmallestUnit } from "@prisma/client";
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
      smallestUnit: SmallestUnit.unit,
      storageUnitSize: 1,
      reorderThreshold: 0,
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      storageUnitName: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      storageUnitSize: (val) => (val <= 0 ? "Tamanho deve ser positivo" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory", {
        method: "POST", // POST to /api/inventory will create an item
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: ApiResponse<InventoryItem> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar item");

      notifications.show({
        title: "Sucesso!",
        message: `Item "${values.name}" definido.`,
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
            placeholder="Ex: Johnnie Walker Black"
            {...form.getInputProps("name")}
          />
          <TextInput
            required
            label="Unidade de Armazenagem"
            placeholder="Ex: Garrafa 750ml, Lata 350ml, Unidade"
            {...form.getInputProps("storageUnitName")}
          />
          <Group grow>
            <Select
              required
              label="Menor Unidade de Venda"
              data={Object.values(SmallestUnit).map((unit) => ({
                label: unit,
                value: unit,
              }))}
              {...form.getInputProps("smallestUnit")}
            />
            <NumberInput
              required
              label="Tamanho (em Menor Unidade)"
              description="Ex: 750 (para ml), 1 (para unidade)"
              min={1}
              {...form.getInputProps("storageUnitSize")}
            />
          </Group>
          <NumberInput
            label="Nível de Alerta de Estoque"
            description="Mostrar alerta quando estoque for <= a este número"
            min={0}
            {...form.getInputProps("reorderThreshold")}
          />

          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Salvar Item
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
