"use client";

import {
  Modal,
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Partner } from "@prisma/client";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type CreatePartnerModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreatePartnerModal({
  opened,
  onClose,
  onSuccess,
}: CreatePartnerModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      companyName: "",
      contactPerson: "",
      contactPhone: "",
    },
    validate: {
      companyName: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: ApiResponse<Partner> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar parceiro");

      notifications.show({
        title: "Sucesso!",
        message: `Parceiro "${values.companyName}" criado.`,
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
      title="Adicionar Novo Parceiro"
      centered
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome da Empresa"
            placeholder="Ex: Tabacaria do Zé"
            {...form.getInputProps("companyName")}
          />
          <TextInput
            label="Pessoa de Contato"
            placeholder="Ex: Zé"
            {...form.getInputProps("contactPerson")}
          />
          <TextInput
            label="Telefone de Contato"
            placeholder="Ex: 47999887766"
            {...form.getInputProps("contactPhone")}
          />
          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Salvar Parceiro
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
