"use client";

import { Select } from "@mantine/core";
import { LiveHostess } from "@/lib/types";

type HostessSelectorProps = {
  hostesses: LiveHostess[];
  loading: boolean;
  selectedHostess: LiveHostess | null;
  onSelect: (hostess: LiveHostess | null) => void;
};

export function HostessSelector({
  hostesses,
  loading,
  selectedHostess,
  onSelect,
}: HostessSelectorProps) {
  const data = hostesses.map((h) => ({
    value: h.hostId.toString(),
    label: h.stageName,
    hostess: h,
  }));

  const handleChange = (value: string | null) => {
    if (!value) {
      onSelect(null);
      return;
    }
    const selected = data.find((d) => d.value === value)?.hostess;
    onSelect(selected || null);
  };

  return (
    <Select
      label="Hostess"
      placeholder={
        loading ? "Carregando..." : "Selecione a hostess da venda"
      }
      data={data}
      value={selectedHostess?.hostId.toString() || null}
      onChange={handleChange}
      searchable
      clearable
      disabled={loading}
    />
  );
}
