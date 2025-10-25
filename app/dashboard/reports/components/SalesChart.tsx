"use client";

import { Paper, Title, Text } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { SalesDataPoint } from "@/lib/types";

export function SalesChart({ data }: { data: SalesDataPoint[] }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Title order={5}>Faturamento por Dia (Últimos 30d)</Title>
      <Text size="xs" c="dimmed" mb="md">
        Mostra o total de vendas processadas por dia.
      </Text>
      <BarChart
        h={300}
        data={data}
        dataKey="date"
        series={[{ name: "sales", color: "privacyGold.9" }]}
        tickLine="none"
        tooltipProps={{
          content: ({ label, payload }) => (
            <Paper px="md" py="sm" withBorder shadow="md" radius="md">
              <Text fw={700} mb={5}>
                {label}
              </Text>
              <Text>
                Vendas: R$ {payload?.[0]?.value?.toFixed(2)}
              </Text>
            </Paper>
          ),
        }}
      />
    </Paper>
  );
}
