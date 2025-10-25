"use client";

import { SimpleGrid, Paper, Title, Stack, Text } from "@mantine/core";
import { LiveClient, LiveHostess } from "@/lib/types";
import { LiveClientCard } from "./LiveClientCard";
import { LiveHostessCard } from "./LiveHostessCard";

type LiveMapProps = {
  clients: LiveClient[];
  hostesses: LiveHostess[];
};

// This component simulates the "environments" we modeled.
// A real app would get these from the `environments` table.
const ENVIRONMENTS = [
  { id: 1, name: "Main Lounge" },
  { id: 2, name: "Poolside" },
  { id: 3, name: "Patio" },
  { id: 4, name: "VIP Lounge 1" },
];

export function LiveMap({ clients, hostesses }: LiveMapProps) {
  // In a real app, clients and hostesses would have a `current_environment_id`.
  // For this demo, we'll just show them in grouped lists.

  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      {/* Column 1: Live Clients */}
      <Paper withBorder p="md" radius="md">
        <Title order={4}>Clientes Ativos ({clients.length})</Title>
        <Text size="sm" c="dimmed" mb="md">
          Clientes que estão na casa com um check-in ativo.
        </Text>
        <Stack>
          {clients.length > 0 ? (
            clients.map((client) => (
              <LiveClientCard key={client.visitId} client={client} />
            ))
          ) : (
            <Text c="dimmed">Nenhum cliente na casa.</Text>
          )}
        </Stack>
      </Paper>

      {/* Column 2: Live Hostesses */}
      <Paper withBorder p="md" radius="md">
        <Title order={4}>Hostesses Disponíveis ({hostesses.length})</Title>
        <Text size="sm" c="dimmed" mb="md">
          Hostesses com check-in e status "Disponível".
        </Text>
        <Stack>
          {hostesses.length > 0 ? (
            hostesses.map((hostess) => (
              <LiveHostessCard key={hostess.shiftId} hostess={hostess} />
            ))
          ) : (
            <Text c="dimmed">Nenhuma hostess disponível.</Text>
          )}
        </Stack>
      </Paper>
    </SimpleGrid>
  );
}
