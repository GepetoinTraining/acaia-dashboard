// File: app/dashboard/bar/page.tsx
"use client";

import { Button, Stack, Tabs, Title, Loader, Text, Center } from "@mantine/core"; // Added Loader, Text, Center
import { PageHeader } from "../components/PageHeader";
import { Box, Package, Plus } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse, AggregatedStock } from "@/lib/types";
import { InventoryItem, UnitOfMeasure } from "@prisma/client"; // Use UnitOfMeasure
import { CurrentStockTable } from "./components/CurrentStockTable";
import { CreateInventoryItemModal } from "./components/CreateInventoryItemModal";
// --- Check this import carefully ---
import { InventoryItemTable } from "./components/InventoryItemTable";
import { AddStockModal } from "./components/AddStockModal";
import { notifications } from "@mantine/notifications"; // Added notifications import


// Define the type expected from the API after serialization
type SerializedInventoryItem = Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest' | 'createdAt'> & {
  storageUnitSizeInSmallest: number | null;
  reorderThresholdInSmallest: number | null;
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
      const [stockRes, itemsRes] = await Promise.all([
         fetch("/api/inventory?aggregate=true"),
         fetch("/api/inventory/items")
      ]);

      // Process stock response
      if (!stockRes.ok) {
           const errorResult = await stockRes.json().catch(() => ({ error: `HTTP error! status: ${stockRes.status}` }));
           throw new Error(errorResult.error || `Falha ao buscar estoque: ${stockRes.status}`);
      }
      const stockResult: ApiResponse<AggregatedStock[]> = await stockRes.json();
      if (stockResult.success && stockResult.data) {
        setStockLevels(stockResult.data);
      } else {
         throw new Error(stockResult.error || "Não foi possível carregar estoque");
      }

      // Process items response
      if (!itemsRes.ok) {
           const errorResult = await itemsRes.json().catch(() => ({ error: `HTTP error! status: ${itemsRes.status}` }));
           throw new Error(errorResult.error || `Falha ao buscar itens: ${itemsRes.status}`);
      }
      const itemsResult: ApiResponse<SerializedInventoryItem[]> = await itemsRes.json();
      if (itemsResult.success && itemsResult.data) {
        setInventoryItems(itemsResult.data);
      } else {
         throw new Error(itemsResult.error || "Não foi possível carregar itens");
      }

    } catch (error: any) { // Catch network or API errors
      console.error("Error fetching inventory data:", error);
       notifications.show({ title: "Erro ao Carregar Dados", message: error.message || "Falha ao buscar dados de inventário", color: "red" });
       setStockLevels([]); // Clear data on error
       setInventoryItems([]);
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
          item={selectedItem as unknown as InventoryItem} // Casting needed
        />
      )}

      <Stack>
        <PageHeader
          title="Inventário"
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={openCreateItem}
              color="pastelGreen"
            >
              Definir Novo Item
            </Button>
          }
        />

        <Tabs defaultValue="stock" color="pastelGreen">
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