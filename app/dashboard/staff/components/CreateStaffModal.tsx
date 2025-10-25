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
// Make sure StaffRole is imported from prisma client for Acaia schema
import { StaffRole } from "@prisma/client";
import { useState } from "react";
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
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
      role: StaffRole.Server, // Adjusted default role for Acaia
      pin: "",
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? "Nome inválido" : null),
      pin: (value) =>
        /^\d{6}$/.test(value) // Exactly 6 digits
          ? null
          : "PIN deve conter exatamente 6 dígitos", // Update error message
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
      title="Adicionar Novo Staff" // Title can be updated if needed
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
            // Ensure data reflects the updated StaffRole enum for Acaia
            data={Object.values(StaffRole).map((role) => ({
              label: role,
              value: role,
            }))}
            {...form.getInputProps("role")}
          />
          <PasswordInput
            required
            label="PIN de Acesso"
            placeholder="6 dígitos" // Updated placeholder
            leftSection={<KeyRound size={16} />}
            {...form.getInputProps("pin")}
            maxLength={6} // Added maxLength
          />
          <Button
            type="submit"
            mt="md"
            color="pastelGreen" // Use new theme color
            disabled={loading}
            loading={loading} // Added loading state to button
          >
            Salvar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}