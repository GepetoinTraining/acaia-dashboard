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
import { ApiResponse, StaffSession } from "@/lib/types"; // Adjust path if needed

export default function StaffLoginPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    // Basic frontend length check before sending
    if (pin.length !== 6) {
        notifications.show({
            title: "PIN Inválido",
            message: "O PIN deve conter exatamente 6 dígitos.",
            color: "yellow",
        });
        return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const result: ApiResponse<StaffSession> = await response.json();

      if (response.ok && result.success && result.data) { // Check result.data exists
        notifications.show({
          title: `Bem-vindo, ${result.data.name}!`, // Use result.data
          message: "Login realizado com sucesso.",
          color: "green",
        });
        // TODO: Redirect to appropriate Acaia dashboard page (e.g., /dashboard/orders)
        router.push("/dashboard"); // Using a generic dashboard path for now
      } else {
        // Use error from result if available, otherwise generic message
        throw new Error(result.error || result.message || "PIN inválido ou falha no login");
      }
    } catch (error: any) {
      notifications.show({
        title: "Erro no Login",
        message: error.message,
        color: "red",
      });
      setLoading(false); // Ensure loading stops on error
      setPin(""); // Clear PIN on error
    }
    // setLoading(false); // Removed from here, handled in success/error paths
  };

  return (
    <Container size="xs" style={{ height: "100vh" }}>
      <Stack justify="center" style={{ height: "100%" }}>
        {/* Adjusted background potentially for lighter theme if needed */}
        <Paper withBorder shadow="xl" p="xl" radius="md" /* bg="dark.8" */>
          <LoadingOverlay visible={loading} />
          <Stack align="center">
            {/* Update logo path */}
            <Image src="/logo.jpg" alt="Acaia Logo" w={150} />

            <Title order={2} /* c="white" */ mt="md">
              Acaia - Acesso Staff
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Por favor, insira seu PIN de staff para continuar.
            </Text>

            <PinInput
              size="xl"
              length={6} // Changed length
              type="number"
              oneTimeCode
              autoFocus
              value={pin}
              onChange={setPin}
              onComplete={handleLogin} // Trigger login on complete
              styles={{
                // Adjust styles if not using dark theme
                // input: {
                //   backgroundColor: "var(--mantine-color-dark-6)",
                //   borderColor: "var(--mantine-color-dark-4)",
                //   color: "var(--mantine-color-white)",
                // },
              }}
            />

            <Button
              fullWidth
              mt="lg"
              color="pastelGreen" // Use new theme color
              onClick={handleLogin}
              loading={loading}
              disabled={pin.length !== 6} // Changed length check
            >
              Entrar
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}