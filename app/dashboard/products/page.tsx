"use client";

import { Button, Stack } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Martini, Plus } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { InventoryItem, Partner, Product } from "@prisma/client";
import { CreateProductModal } from "./components/CreateProductModal";
import { ProductTable } from "./components/ProductTable";

// This type extends Product to include the related data
export type ProductWithRelations = Product & {
  inventoryItem: InventoryItem | null;
  partner: Partner | null;
};

function ProductsClientPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const result: ApiResponse<ProductWithRelations[]> = await response.json();
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error(error);
      // TODO: Show notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <>
      <CreateProductModal
        opened={opened}
        onClose={close}
        onSuccess={() => {
          close();
          fetchProducts(); // Refresh the table
        }}
      />
      <Stack>
        <PageHeader
          title="Produtos (Menu)"
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={open}
              color="privacyGold"
            >
              Adicionar Produto
            </Button>
          }
        />
        <ProductTable products={products} loading={loading} />
      </Stack>
    </>
  );
}

export default function ProductsPage() {
  return <ProductsClientPage />;
}
