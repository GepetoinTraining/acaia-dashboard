// File: app/dashboard/bar/page.tsx
"use client";

import { Button, Stack, Tabs, Title } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Box, Package, Plus } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse, AggregatedStock } from "@/lib/types";
// --- FIX: Import UnitOfMeasure instead of SmallestUnit ---
import { InventoryItem, UnitOfMeasure } from "@prisma/client";
import { CurrentStockTable } from "./components/CurrentStockTable";
import { CreateInventoryItemModal } from "./components/CreateInventoryItemModal";
// --- FIX: Ensure import name matches export name (should be correct already) ---
import { InventoryItemTable } from "./components/InventoryItemTable";
import { AddStockModal } from "./components/AddStockModal";

// Define the type expected from the API after serialization
// Using the correct UnitOfMeasure enum
type SerializedInventoryItem = Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest' | 'createdAt'> & {
  storageUnitSizeInSmallest: number | null;
  reorderThresholdInSmallest: number | null;
  // --- FIX: Ensure smallestUnit uses the correct enum type ---
  smallestUnit: UnitOfMeasure;
};


function BarClientPage() {
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);

  const [stockLevels, setStockLevels] = useState<AggregatedStock[]>([]);
  const [inventoryItems, setInventoryItems] = useState<SerializedInventoryItem[]>([]);

  const [createItemModal, { open: openCreateItem, close: closeCreateItem }] =
    useDisclosure(false);
  const [addStockModal, { open: openAddStock, close: closeAddStock }] =
    useDisclosure(false);
  const [selectedItem, setSelectedItem] = useState<SerializedInventoryItem | null>(null);

  const fetchData = async () => {
    setLoadingStock(true);
    setLoadingItems(true);
    try {
      const stockRes = await fetch("/api/inventory?aggregate=true");
      const stockResult: ApiResponse<AggregatedStock[]> = await stockRes.json();
      if (stockResult.success && stockResult.data) {
        setStockLevels(stockResult.data);
      } else {
         // Handle error if needed
         console.error("Failed to fetch stock levels:", stockResult.error);
         notifications.show({ title: "Erro", message: stockResult.error || "Falha ao buscar estoque", color: "red" });
      }

      const itemsRes = await fetch("/api/inventory/items");
      const itemsResult: ApiResponse<SerializedInventoryItem[]> = await itemsRes.json();
      if (itemsResult.success && itemsResult.data) {
        setInventoryItems(itemsResult.data); // Use data directly
      } else {
         // Handle error if needed
         console.error("Failed to fetch inventory items:", itemsResult.error);
         notifications.show({ title: "Erro", message: itemsResult.error || "Falha ao buscar itens", color: "red" });
      }
    } catch (error: any) { // Catch network errors
      console.error("Error fetching inventory data:", error);
       notifications.show({ title: "Erro de Rede", message: error.message || "Falha ao buscar dados de inventário", color: "red" });
    } finally {
      setLoadingStock(false);
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddStock = (item: SerializedInventoryItem) => {
    setSelectedItem(item);
    openAddStock();
  };

  const handleSuccess = () => {
    closeCreateItem();
    closeAddStock();
    fetchData(); // Refresh both stock and item lists
  };

  return (
    <>
      <CreateInventoryItemModal
        opened={createItemModal}
        onClose={closeCreateItem}
        onSuccess={handleSuccess}
      />
      {selectedItem && (
        <AddStockModal
          opened={addStockModal}
          onClose={closeAddStock}
          onSuccess={handleSuccess}
          // --- FIX: Cast selectedItem (SerializedInventoryItem) to InventoryItem for the modal prop ---
          // This assumes AddStockModal primarily uses fields present in both,
          // but be mindful if it strictly needs Decimal types (it shouldn't based on previous checks).
          item={selectedItem as unknown as InventoryItem}
        />
      )}

      <Stack>
        <PageHeader
          title="Inventário" // Renamed title slightly
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={openCreateItem}
              color="pastelGreen" // Use theme color
            >
              Definir Novo Item
            </Button>
          }
        />

        <Tabs defaultValue="stock" color="pastelGreen"> {/* Use theme color */}
          <Tabs.List>
            <Tabs.Tab value="stock" leftSection={<Box size={16} />}>
              Estoque Atual
            </Tabs.Tab>
            <Tabs.Tab value="items" leftSection={<Package size={16} />}>
              Itens Definidos
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="stock" pt="md">
            <CurrentStockTable
              stockLevels={stockLevels}
              loading={loadingStock}
              onAddStock={(stockItem) => {
                 // Find the full item definition based on the stock item ID
                 const fullItem = inventoryItems.find((i) => i.id === stockItem.inventoryItemId);
                 if (fullItem) {
                   handleOpenAddStock(fullItem);
                 } else {
                     notifications.show({ title: "Erro", message: `Definição do item ID ${stockItem.inventoryItemId} não encontrada.`, color: "red"});
                 }
              }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="items" pt="md">
            {/* Ensure the imported InventoryItemTable is used */}
            <InventoryItemTable
              items={inventoryItems}
              loading={loadingItems}
              onAddStock={handleOpenAddStock}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </>
  );
}

export default function BarPage() {
  return <BarClientPage />;
}