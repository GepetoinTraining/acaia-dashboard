// PATH: app/dashboard/stock/page.tsx
"use client";

import { Button, Stack, Tabs, Title, Loader, Text, Center, SegmentedControl } from "@mantine/core"; // Added SegmentedControl
import { PageHeader } from "../components/PageHeader";
import { Box, Package, Plus, MapPin } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useMemo } from "react"; // Added useMemo
import { ApiResponse, AggregatedIngredientStock, SerializedStockHolding } from "@/lib/types";
import { Ingredient, VenueObject } from "@prisma/client";
import { CurrentStockTable } from "./components/CurrentStockTable";
import { IngredientDefinitionTable } from "./components/IngredientDefinitionTable";
import { AddStockHoldingModal } from "./components/AddStockHoldingModal";
import { StockHoldingsTable } from "./components/StockHoldingsTable";
import { notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

// Type for Ingredient Definition from API
type SerializedIngredientDef = Omit<Ingredient, "costPerUnit"> & {
  costPerUnit: string;
  isPrepared: boolean; // Ensure flag is here
};

// Type for VenueObject used as location
type StockLocation = Pick<VenueObject, 'id' | 'name'>;

// Filter type state
type StockFilter = 'ALL' | 'RAW' | 'PREPARED';

// Wrapper for React Query
export default function StockPageWrapper() {
    return (
        <QueryClientProvider client={new QueryClient()}>
            <StockPage/>
        </QueryClientProvider>
    );
}

function StockPage() {
  const queryClient = useQueryClient(); // Get query client instance
  const [addStockModal, { open: openAddStock, close: closeAddStock }] = useDisclosure(false);
  const [selectedIngredient, setSelectedIngredient] = useState<SerializedIngredientDef | null>(null);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL'); // State for filter

  // Fetch Aggregated Stock
  const {
      data: aggregatedStock,
      isLoading: loadingAggregatedStock,
      refetch: refetchAggregatedStock,
      isError: isAggregatedError,
      error: aggregatedError,
  } = useQuery<AggregatedIngredientStock[]>({ queryKey: ['aggregatedStock'], /* ... queryFn */ });

  // Fetch Ingredient Definitions
  const {
      data: ingredientDefs,
      isLoading: loadingDefs,
      refetch: refetchDefs,
      isError: isDefsError,
      error: defsError,
  } = useQuery<SerializedIngredientDef[]>({ queryKey: ['ingredientDefinitions'], /* ... queryFn */ });

   // Fetch Stock Locations
    const { isLoading: loadingLocations } = useQuery<StockLocation[]>({ queryKey: ['stockLocations'], /* ... queryFn and setLocations */ });

  // Memoize filtered aggregated stock
  const filteredAggregatedStock = useMemo(() => {
    if (!aggregatedStock) return [];
    if (stockFilter === 'ALL') return aggregatedStock;
    const filterPrepared = stockFilter === 'PREPARED';
    return aggregatedStock.filter(item => item.isPrepared === filterPrepared);
  }, [aggregatedStock, stockFilter]);

  const handleOpenAddStock = (ingredient: SerializedIngredientDef) => { /* ... */ };
  const handleSuccess = () => { /* ... */ };
  const isLoading = loadingAggregatedStock || loadingDefs || loadingLocations;


  return (
    <>
      {/* ... (Modal definition remains the same) ... */}
       {selectedIngredient && (
        <AddStockHoldingModal
          opened={addStockModal}
          onClose={closeAddStock}
          onSuccess={handleSuccess}
          ingredient={selectedIngredient}
          locations={locations}
        />
      )}

      <Stack>
        <PageHeader title="Gerenciamento de Estoque" />

        <Tabs defaultValue="aggregated" color="blue">
          <Tabs.List>
            <Tabs.Tab value="aggregated" leftSection={<Box size={16} />}>
              Estoque Agregado
            </Tabs.Tab>
             <Tabs.Tab value="holdings" leftSection={<MapPin size={16} />}>
              Lotes por Localização
            </Tabs.Tab>
            <Tabs.Tab value="definitions" leftSection={<Package size={16} />}>
              Definições de Ingredientes
            </Tabs.Tab>
          </Tabs.List>

          {/* Aggregated Stock Tab */}
          <Tabs.Panel value="aggregated" pt="md">
             {isAggregatedError && <Text c="red">Erro: {(aggregatedError as Error)?.message}</Text>}
             {/* Filter Control */}
             <SegmentedControl
                mb="md"
                value={stockFilter}
                onChange={(value) => setStockFilter(value as StockFilter)}
                data={[
                    { label: 'Todos', value: 'ALL' },
                    { label: 'Matéria Prima', value: 'RAW' },
                    { label: 'Preparados', value: 'PREPARED' },
                ]}
              />
            <CurrentStockTable
              stockLevels={filteredAggregatedStock} // Pass filtered data
              loading={loadingAggregatedStock}
              onAddStockClick={(aggItem) => { /* ... */ }}
            />
          </Tabs.Panel>

          {/* Stock Holdings Tab */}
          <Tabs.Panel value="holdings" pt="md">
              <StockHoldingsTable
                  ingredientDefs={ingredientDefs ?? []}
                  locations={locations}
                  onAddStockClick={handleOpenAddStock}
                  // Pass filter state if filtering needed here too
                  initialFilter={stockFilter} // Example: sync filter state
              />
          </Tabs.Panel>

          {/* Definitions Tab */}
          <Tabs.Panel value="definitions" pt="md">
             {isDefsError && <Text c="red">Erro: {(defsError as Error)?.message}</Text>}
              {/* Optional: Add filter here too */}
            <IngredientDefinitionTable
              items={ingredientDefs ?? []} // Potentially filter here too based on stockFilter
              loading={loadingDefs}
              onAddStockClick={handleOpenAddStock}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </>
  );
}