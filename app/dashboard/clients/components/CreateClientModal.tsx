"use client";

import {
  Modal,
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
  Select,
  JsonInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Client, ClientStatus, Staff } from "@prisma/client";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type CreateClientModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

// Default JSON structure for the crmData field
const defaultCrmData = {
  visit_pattern: {},
  preferred_drinks: [],
  common_hosts: [],
  social_profile: {
    origin: { is_local: true, city: "Balneário Camboriú", state: "SC" },
    professional: {},
    personal: {},
    hobbies_interests: {},
    lifestyle_cues: {},
    service_profile: {},
    general_notes: "",
  },
};

type StaffSelect = { label: string; value: string };

export function CreateClientModal({
  opened,
  onClose,
  onSuccess,
}: CreateClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffSelect[]>([]);

  const form = useForm({
    initialValues: {
      name: "",
      phoneNumber: "",
      status: ClientStatus.new,
      acquiredByStaffId: null as string | null,
      crmData: JSON.stringify(defaultCrmData, null, 2),
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      crmData: (val) => {
        try {
          JSON.parse(val);
          return null;
        } catch (e) {
          return "JSON inválido";
        }
      },
    },
  });

  // Fetch staff list for CAC tracking
  useEffect(() => {
    if (opened) {
      fetch("/api/staff")
        .then((res) => res.json())
        .then((result: ApiResponse<Staff[]>) => {
          if (result.success && result.data) {
            setStaffList(
              result.data.map((s) => ({
                label: `${s.name} (${s.defaultRole})`,
                value: s.id.toString(),
              }))
            );
          }
        });
    } else {
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        crmData: JSON.parse(values.crmData), // Send as JSON object
      };

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<Client> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar cliente");

      notifications.show({
        title: "Sucesso!",
        message: `Cliente "${values.name}" criado.`,
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
      title="Adicionar Novo Cliente"
      centered
      size="xl"
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome"
            placeholder="Ex: João da Silva"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Telefone (com DDD)"
            placeholder="Ex: 47999887766"
            {...form.getInputProps("phoneNumber")}
          />
          <Select
            label="Status"
            data={Object.values(ClientStatus).map((s) => ({
              label: s,
              value: s,
            }))}
            {...form.getInputProps("status")}
          />
          <Select
            label="Adquirido por (CAC)"
            placeholder="Selecione um staff"
            data={staffList}
            searchable
            clearable
            {...form.getInputProps("acquiredByStaffId")}
          />
          <JsonInput
            label="Perfil do Cliente (CRM)"
            description="Edite o JSON com os detalhes do cliente."
            formatOnBlur
            autosize
            minRows={15}
            {...form.getInputProps("crmData")}
          />
          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Salvar Cliente
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
