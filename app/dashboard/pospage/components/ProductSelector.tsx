"use client";

import { Select } from "@mantine/core";
import { Product } from "@prisma/client";
import { useState } from "react";

type ProductSelectorProps = {
  products: Product[];
  loading: boolean;
  onAddProduct: (product: Product) => void;
};

export function ProductSelector({
  products,
  loading,
  onAddProduct,
}: ProductSelectorProps) {
  const [value, setValue] = useState<string | null>(null);

  const data = products.map((p) => ({
    value: p.id.toString(),
    label: `${p.name} - R$ ${p.salePrice.toFixed(2)}`,
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
