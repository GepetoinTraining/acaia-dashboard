"use client";

import {
  Modal,
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
  NumberInput,
  Group,
  JsonInput,
  Checkbox,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Host, HostStatus } from "@prisma/client";
import { useState } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type CreateHostessModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

// Default JSON structure for the profileData field
const defaultProfileJson = {
  physical: {
    body_type: "",
    height_cm: 165,
    hair_color: "",
    ethnicity: "",
  },
  preferences: {
    preferred_client_style: [],
    non_preferred_client_style: [],
  },
  skills: {
    languages: [{ lang: "Portuguese", level: "Native" }],
    talking_subjects: [
      { topic: "Business/Finance", level: "Poor" },
      { topic: "Global Travel", level: "Poor" },
    ],
  },
  service_profile: {
    interaction_style: "",
    service_notes: "",
  },
};

export function CreateHostessModal({
  opened,
  onClose,
  onSuccess,
}: CreateHostessModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      stageName: "",
      status: HostStatus.new,
      commissionRate: 0.1, // 10%
      baseRate: 500,
      isRateNegotiable: true,
      profileData: JSON.stringify(defaultProfileJson, null, 2),
    },
    validate: {
      stageName: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      commissionRate: (val) =>
        val <= 0 || val > 1 ? "Comissão deve ser entre 0.01 e 1.0" : null,
      baseRate: (val) => (val < 0 ? "Taxa base deve ser positiva" : null),
      profileData: (val) => {
        try {
          JSON.parse(val);
          return null;
        } catch (e) {
          return "JSON inválido";
        }
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        profileData: JSON.parse(values.profileData), // Send as JSON object
      };

      const response = await fetch("/api/hostesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<Host> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar hostess");

      notifications.show({
        title: "Sucesso!",
        message: `Hostess "${values.stageName}" criada.`,
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
      title="Adicionar Nova Hostess"
      centered
      size="xl"
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Group grow>
            <TextInput
              required
              label="Nome de Palco"
              placeholder="Ex: Angel"
              {...form.getInputProps("stageName")}
            />
            <Select
              label="Status"
              data={Object.values(HostStatus).map((s) => ({
                label: s,
                value: s,
              }))}
              {...form.getInputProps("status")}
            />
          </Group>
          <Group grow>
            <NumberInput
              required
              label="Comissão (Ex: 0.1 para 10%)"
              min={0.01}
              max={1}
              step={0.01}
              decimalScale={2}
              {...form.getInputProps("commissionRate")}
            />
            <NumberInput
              required
              label="Taxa Base (R$)"
              description="Valor base dela"
              min={0}
              step={50}
              {...form.getInputProps("baseRate")}
            />
          </Group>
          <Checkbox
            label="Taxa é negociável"
            {...form.getInputProps("isRateNegotiable", { type: "checkbox" })}
          />
          <JsonInput
            label="Perfil da Hostess (Skills, Descrição, etc.)"
            description="Edite o JSON com os detalhes da hostess."
            formatOnBlur
            autosize
            minRows={15}
            {...form.getInputProps("profileData")}
          />
          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Salvar Hostess
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
