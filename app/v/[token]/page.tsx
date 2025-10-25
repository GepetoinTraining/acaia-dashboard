import { verifyClientToken } from "@/lib/qr";
import { prisma } from "@/lib/prisma";
import { Alert, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { AlertCircle } from "lucide-react";

type ClientTokenPageProps = {
  params: {
    token: string;
  };
};

// This is a Server Component that validates the token
export default async function ClientTokenPage({
  params,
}: ClientTokenPageProps) {
  const { token } = params;
  const payload = verifyClientToken(token);

  if (!payload) {
    return (
      <Container size="xs" py="xl">
        <Alert
          color="red"
          title="Token Inválido"
          icon={<AlertCircle />}
          variant="filled"
        >
          Este QR code é inválido ou expirou. Por favor, solicite um novo na
          recepção.
        </Alert>
      </Container>
    );
  }

  // Token is valid, fetch the visit data
  const visit = await prisma.visit.findUnique({
    where: { id: payload.visitId },
    include: { client: true },
  });

  if (!visit || visit.exitTime) {
    return (
      <Container size="xs" py="xl">
        <Alert
          color="orange"
          title="Visita Encerrada"
          icon={<AlertCircle />}
          variant="filled"
        >
          Esta visita já foi encerrada. Obrigado!
        </Alert>
      </Container>
    );
  }

  // --- SUCESSO ---
  // This is the "app" the client sees on their phone
  return (
    <Container size="xs" py="xl">
      <Stack>
        <Title order={2} ta="center">
          Bem-vindo, {visit.client?.name} #{visit.clientId}
        </Title>
        <Paper withBorder p="lg" radius="md">
          <Text size="lg" c="dimmed" ta="center">
            Seu Crédito Consumível
          </Text>
          <Text fz={48} fw={700} ta="center" c="privacyGold">
            R$ {visit.consumableCreditRemaining.toString()}
          </Text>
        </Paper>

        <Paper withBorder p="lg" radius="md" mt="xl">
          <Title order={3} mb="md">
            Hostesses Disponíveis
          </Title>
          <Text c="dimmed">
            [A lista de hostesses disponíveis no mesmo ambiente que você
            aparecerá aqui.]
          </Text>
        </Paper>

        <Paper withBorder p="lg" radius="md" mt="md">
          <Title order={3} mb="md">
            Menu
          </Title>
          <Text c="dimmed">
            [O menu de bebidas para pedidos aparecerá aqui.]
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
}
