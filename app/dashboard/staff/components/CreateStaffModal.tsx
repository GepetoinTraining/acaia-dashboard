"use client";

import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  PasswordInput,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { StaffRole } from "@prisma/client";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import { User, KeyRound } from "lucide-react";

type CreateStaffModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateStaffModal({
  opened,
  onClose,
  onSuccess,
}: CreateStaffModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      role: StaffRole.Server,
      pin: "",
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? "Nome inválido" : null),
      pin: (value) =>
        /^\d{4,10}$/.test(value)
          ? null
          : "PIN deve conter de 4 a 10 dígitos",
      role: (value) => (Object.values(StaffRole).includes(value) ? null : "Cargo inválido"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao criar staff");
      }

      notifications.show({
        title: "Sucesso!",
        message: `Staff "${values.name}" criado com sucesso.`,
        color: "green",
      });
      onSuccess(); // Triggers table refresh and closes modal
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Erro",
        message: error.message || "Um erro inesperado ocorreu.",
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
      title="Adicionar Novo Staff"
      centered
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome"
            placeholder="Nome do funcionário"
            leftSection={<User size={16} />}
            {...form.getInputProps("name")}
          />
          <Select
            required
            label="Cargo"
            data={Object.values(StaffRole).map((role) => ({
              label: role,
              value: role,
            }))}
            {...form.getInputProps("role")}
          />
          <PasswordInput
            required
            label="PIN de Acesso"
            placeholder="4 a 10 dígitos"
            leftSection={<KeyRound size={16} />}
            {...form.getInputProps("pin")}
          />
          <Button
            type="submit"
            mt="md"
            color="privacyGold"
            disabled={loading}
          >
            Salvar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
