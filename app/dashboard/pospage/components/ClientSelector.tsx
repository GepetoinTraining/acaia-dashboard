"use client";

// Add Stack to the import from @mantine/core
import { Select, Text, Group, Stack } from "@mantine/core";
import { LiveClient } from "@/lib/types";

type ClientSelectorProps = {
  clients: LiveClient[];
  loading: boolean;
  selectedClient: LiveClient | null;
  onSelect: (client: LiveClient | null) => void;
};

export function ClientSelector({
  clients,
  loading,
  selectedClient,
  onSelect,
}: ClientSelectorProps) {
  const data = clients.map((c) => ({
    value: c.visitId.toString(),
    label: `${c.name || "Anônimo"} (ID: ${c.clientId})`,
    client: c,
  }));

  const handleChange = (value: string | null) => {
    if (!value) {
      onSelect(null);
      return;
    }
    const selected = data.find((d) => d.value === value)?.client;
    onSelect(selected || null);
  };

  return (
    // Stack component is now recognized
    <Stack gap="xs">
      <Select
        label="Cliente"
        placeholder={loading ? "Carregando..." : "Selecione um cliente na casa"}
        data={data}
        value={selectedClient?.visitId.toString() || null}
        onChange={handleChange}
        searchable
        clearable
        disabled={loading}
      />
      {selectedClient && (
        <Text size="sm" c="green.7" fw={500}>
          Crédito disponível: R${" "}
          {/* Ensure consumableCreditRemaining is treated as a number here */}
          {Number(selectedClient.consumableCreditRemaining).toFixed(2)}
        </Text>
      )}
    </Stack>
  );
}
