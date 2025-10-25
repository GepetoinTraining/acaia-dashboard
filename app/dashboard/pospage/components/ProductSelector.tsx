"use client";

import { Select } from "@mantine/core";
// --- FIX: Change this import from "@prisma/client" to "@/lib/types" ---
import { Product } from "@/lib/types"; 
import { useState } from "react";

type ProductSelectorProps = {
  products: Product[]; // This now correctly expects Product with 'number' prices
  loading: boolean;
  onAddProduct: (product: Product) => void; // This also expects 'number' prices
};

export function ProductSelector({
  products,
  loading,
  onAddProduct,
}: ProductSelectorProps) {
  const [value, setValue] = useState<string | null>(null);

  const data = products.map((p) => ({
    value: p.id.toString(),
    // This .toFixed(2) call confirms the component needs a 'number', not a 'Decimal'
    label: `${p.name} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.salePrice)}`,
    product: p,
  }));

  const handleChange = (value: string | null) => {
    if (!value) return;
    const selected = data.find((d) => d.value === value)?.product;
    if (selected) {
      onAddProduct(selected);
    }
    setValue(null); // Reset selector after adding
  };

  return (
    <Select
      label="Buscar Produto"
      placeholder={loading ? "Carregando..." : "Digite para buscar um item"}
      data={data}
      value={value}
      onChange={handleChange}
      searchable
      clearable
      disabled={loading}
    />
  );
}