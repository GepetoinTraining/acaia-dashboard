"use client";

import { Button, Stack, Tabs, Title } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Box, Package, Plus } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse, AggregatedStock } from "@/lib/types";
import { InventoryItem, SmallestUnit } from "@prisma/client";
import { CurrentStockTable } from "./components/CurrentStockTable";
import { CreateInventoryItemModal } from "./components/CreateInventoryItemModal";
import { InventoryItemTable } from "./components/InventoryItemTable";
import { AddStockModal } from "./components/AddStockModal";

// Define the type expected from the API after serialization
// REMOVED createdAt
type SerializedInventoryItem = Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest' | 'createdAt'> & { // Added createdAt to Omit
  storageUnitSizeInSmallest: number | null;
  reorderThresholdInSmallest: number | null;
  // createdAt: Date | string; // REMOVED
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
      }

      const itemsRes = await fetch("/api/inventory/items");
      const itemsResult: ApiResponse<SerializedInventoryItem[]> = await itemsRes.json();
      if (itemsResult.success && itemsResult.data) {
        // REMOVED Date conversion logic
        // const itemsWithDates = itemsResult.data.map(item => ({
        //   ...item,
        //   createdAt: new Date(item.createdAt)
        // }));
        setInventoryItems(itemsResult.data); // Use data directly
      }
    } catch (error) {
      console.error(error);
      // TODO: Show notification
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
    fetchData();
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
          item={selectedItem as InventoryItem} // Casting remains, ensure AddStockModal doesn't need createdAt
        />
      )}

      <Stack>
        <PageHeader
          title="Bar / Inventário"
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={openCreateItem}
              color="privacyGold"
            >
              Definir Novo Item
            </Button>
          }
        />

        <Tabs defaultValue="stock">
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
                 }
              }}
            />
          </Tabs.Panel>

          <Tabs.Panel value="items" pt="md">
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