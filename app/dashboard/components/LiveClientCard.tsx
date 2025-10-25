"use client";

import { Paper, Group, Text, Badge } from "@mantine/core";
import { LiveClient } from "@/lib/types";
import { User } from "lucide-react";

export function LiveClientCard({ client }: { client: LiveClient }) {
  return (
    <Paper withBorder p="sm" radius="md" shadow="xs">
      <Group justify="space-between">
        <Group>
          <User size={18} />
          <Text fw={500}>{client.name}</Text>
        </Group>
        <Badge color="green" variant="light">
          Crédito: R$ {client.consumableCreditRemaining.toFixed(2)}
        </Badge>
      </Group>
    </Paper>
  );
}
