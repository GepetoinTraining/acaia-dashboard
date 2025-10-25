"use client";

import { Paper, Group, Text, Badge } from "@mantine/core";
import { LiveHostess } from "@/lib/types";
import { Heart } from "lucide-react";

export function LiveHostessCard({ hostess }: { hostess: LiveHostess }) {
  return (
    <Paper withBorder p="sm" radius="md" shadow="xs">
      <Group justify="space-between">
        <Group>
          <Heart size={18} color="pink" />
          <Text fw={500}>{hostess.stageName}</Text>
        </Group>
        <Badge color="blue" variant="light">
          Disponível
        </Badge>
      </Group>
    </Paper>
  );
}
