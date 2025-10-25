"use client";

import {
  Button,
  Stack,
  Text,
  Image,
  Paper,
  SimpleGrid,
  NumberInput,
  LoadingOverlay,
  Center,
} from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { UserCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "@mantine/form";
import { ApiResponse, QrTokenPayload } from "@/lib/types";
import { notifications } from "@mantine/notifications";

export default function CashierPage() {
  const [loading, setLoading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      entryFee: 200,
      consumableCredit: 100,
    },
    validate: {
      entryFee: (val) => (val >= 0 ? null : "Valor deve ser positivo"),
      consumableCredit: (val) => (val >= 0 ? null : "Valor deve ser positivo"),
    },
  });

  const handleCheckIn = async (values: typeof form.values) => {
    setLoading(true);
    setGeneratedQR(null);
    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: ApiResponse<QrTokenPayload> = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Falha ao gerar QR code");
      }

      setGeneratedQR(result.data.qrCodeUrl);
      notifications.show({
        title: "Sucesso!",
        message: "Novo cliente em check-in. Imprima o QR code.",
        color: "green",
      });
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
    <Stack>
      <PageHeader title="Caixa / Check-in" />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        {/* Coluna 1: Formulário de Check-in */}
        <Paper withBorder p="xl" radius="md" pos="relative">
          <LoadingOverlay visible={loading} />
          <form onSubmit={form.onSubmit(handleCheckIn)}>
            <Stack>
              <Text fw={500} size="lg">
                Check-in de Novo Patrono
              </Text>
              <NumberInput
                label="Taxa de Entrada (R$)"
                placeholder="200"
                min={0}
                step={50}
                {...form.getInputProps("entryFee")}
              />
              <NumberInput
                label="Crédito Consumível (R$)"
                placeholder="100"
                min={0}
                step={10}
                {...form.getInputProps("consumableCredit")}
              />
              <Button
                type="submit"
                leftSection={<UserCheck size={18} />}
                color="privacyGold"
                size="lg"
                mt="md"
                loading={loading}
              >
                Gerar QR Code de Acesso
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Coluna 2: QR Code Gerado */}
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" justify="center" h="100%">
            {generatedQR ? (
              <>
                <Text fw={500} size="lg">
                  QR Code Gerado
                </Text>
                <Image
                  src={generatedQR}
                  alt="QR Code do Cliente"
                  w={300}
                  h={300}
                  radius="md"
                />
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  color="gray"
                >
                  Imprimir
                </Button>
              </>
            ) : (
              <Center h={300}>
                <Text c="dimmed">
                  O QR code para o cliente aparecerá aqui.
                </Text>
              </Center>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
