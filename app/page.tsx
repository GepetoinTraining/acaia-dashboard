"use client";

import {
  Container,
  Paper,
  Title,
  Text,
  PinInput,
  Stack,
  Button,
  LoadingOverlay,
  Center,
  Image,
} from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { ApiResponse, StaffSession } from "@/lib/types";

export default function StaffLoginPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const result: ApiResponse<StaffSession> = await response.json();

      if (response.ok && result.success) {
        notifications.show({
          title: `Bem-vindo, ${result.data?.name}!`,
          message: "Login realizado com sucesso.",
          color: "green",
        });
        // Redirect to the main live dashboard
        router.push("/dashboard/live");
      } else {
        throw new Error(result.message || "PIN inválido ou falha no login");
      }
    } catch (error: any) {
      notifications.show({
        title: "Erro no Login",
        message: error.message,
        color: "red",
      });
      setLoading(false);
      setPin("");
    }
  };

  return (
    <Container size="xs" style={{ height: "100vh" }}>
      <Stack justify="center" style={{ height: "100%" }}>
        <Paper withBorder shadow="xl" p="xl" radius="md" bg="dark.8">
          <LoadingOverlay visible={loading} />
          <Stack align="center">
            <Image src="/logo.png" alt="Privacy Club Logo" w={250} />

            <Title order={2} c="white" mt="md">
              Acesso Restrito
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Por favor, insira seu PIN de staff para continuar.
            </Text>

            <PinInput
              size="xl"
              length={4}
              type="number"
              oneTimeCode
              autoFocus
              value={pin}
              onChange={setPin}
              onComplete={handleLogin}
              styles={{
                input: {
                  backgroundColor: "var(--mantine-color-dark-6)",
                  borderColor: "var(--mantine-color-dark-4)",
                  color: "var(--mantine-color-white)",
                },
              }}
            />

            <Button
              fullWidth
              mt="lg"
              color="privacyGold"
              onClick={handleLogin}
              loading={loading}
              disabled={pin.length !== 4}
            >
              Entrar
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

