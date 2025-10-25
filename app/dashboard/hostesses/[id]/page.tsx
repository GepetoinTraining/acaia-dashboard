import { PageHeader } from "../../components/PageHeader";
import { Text, Paper, Stack } from "@mantine/core";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type HostessDetailPageProps = {
  params: { id: string };
};

export default async function HostessDetailPage({
  params,
}: HostessDetailPageProps) {
  const id = parseInt(params.id);
  if (isNaN(id)) return notFound();

  const hostess = await prisma.host.findUnique({
    where: { id },
  });

  if (!hostess) return notFound();

  return (
    <Stack>
      <PageHeader title={hostess.stageName} />
      <Paper withBorder p="xl" radius="md">
        <Text>Detalhes da Hostess:</Text>
        <Text c="dimmed">
          Aqui você verá o perfil completo, histórico de vendas e performance da{" "}
          {hostess.stageName}.
        </Text>
      </Paper>
    </Stack>
  );
}
