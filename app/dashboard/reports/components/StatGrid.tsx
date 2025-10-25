"use client";

import { ReportStat } from "@/lib/types";
import { SimpleGrid, Paper, Text, Group, ThemeIcon } from "@mantine/core";
import { ArrowUpRight } from "lucide-react";

export function StatGrid({ stats }: { stats: ReportStat[] }) {
  const cards = stats.map((stat) => (
    <Paper withBorder p="md" radius="md" key={stat.title}>
      <Group justify="space-between">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {stat.title}
        </Text>
        {/* Placeholder for diff */}
        {/* <ThemeIcon
          color="gray"
          variant="light"
          sx={(theme) => ({
            color: stat.diff > 0 ? theme.colors.teal[6] : theme.colors.red[6],
          })}
          size={38}
          radius="md"
        >
          <ArrowUpRight size="1.8rem" strokeWidth={1.5} />
        </ThemeIcon> */}
      </Group>

      <Group align="flex-end" gap="xs" mt={20}>
        <Text fz={38} fw={700} lh={1}>
          {stat.value}
        </Text>
        {/* <Text c={stat.diff > 0 ? "teal" : "red"} fz="sm" fw={500}>
          <span>{stat.diff}%</span>
        </Text> */}
      </Group>

      <Text fz="xs" c="dimmed" mt={7}>
        Comparado aos 30 dias anteriores
      </Text>
    </Paper>
  ));

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
      {cards}
    </SimpleGrid>
  );
}
