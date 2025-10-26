// PATH: app/dashboard/inventory/page.tsx
// NOTE: This is a NEW FILE in a NEW FOLDER.

"use client";

import { useState, useEffect } from "react";
import { Button, Container, Stack, Group } from "@mantine/core";
import { IconPlus, IconStackPush } from "@tabler/icons-react";
import { Ingredient } from "@prisma/client";
import { PageHeader } from "../components/PageHeader";
import { IngredientTable } from "./components/IngredientTable";
import { CreateIngredientModal } from "./components/CreateIngredientModal";
import { UpdateStockModal } from "./components/UpdateStockModal"; // New modal
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

// The API returns stock and cost as strings
export type SerializedIngredient = Omit<
  Ingredient,
  "stock" | "costPerUnit"
> & {
  stock: string;
  costPerUnit: string;
};

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<SerializedIngredient[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateStockModalOpen, setIsUpdateStockModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] =
    useState<SerializedIngredient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIngredients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ingredients");
      const data: ApiResponse<SerializedIngredient[]> = await response.json();
      if (data.success && data.data) {
        setIngredients(data.data);
      } else {
        notifications.show({
          title: "Erro",
          message: data.error || "Falha ao carregar ingredientes",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Fetch ingredients error:", error);
      notifications.show({
        title: "Erro",
        message: "Falha ao carregar ingredientes",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleOpenUpdateStock = (ingredient: SerializedIngredient) => {
    setSelectedIngredient(ingredient);
    setIsUpdateStockModalOpen(true);
  };

  const handleCloseUpdateStock = () => {
    setSelectedIngredient(null);
    setIsUpdateStockModalOpen(false);
  };

  return (
    <Container fluid>
      <Stack gap="lg">
        <PageHeader title="Inventário (Ingredientes)" />
        <Group>
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Novo Ingrediente
          </Button>
        </Group>
        <IngredientTable
          data={ingredients}
          isLoading={isLoading}
          onRefresh={fetchIngredients}
          onUpdateStock={handleOpenUpdateStock}
        />
      </Stack>

      <CreateIngredientModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchIngredients();
        }}
      />

      <UpdateStockModal
        opened={isUpdateStockModalOpen}
        onClose={handleCloseUpdateStock}
        onSuccess={() => {
          handleCloseUpdateStock();
          fetchIngredients();
        }}
        ingredient={selectedIngredient}
      />
    </Container>
  );
}