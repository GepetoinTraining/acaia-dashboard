// File: app/dashboard/pospage/page.tsx
"use client";

import { /* ... Mantine imports ... */ } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { /* ... Lucide imports ... */ } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useCallback } from "react";
// --- FIX: Import updated CartItem, SeatingAreaWithVisitInfo, Product ---
import { ApiResponse, CartItem, SeatingAreaWithVisitInfo, Product } from "@/lib/types";
// Import base Prisma types only if needed for specific logic (unlikely here)
import { Visit, Client, SeatingArea, ProductType, PrepStation, InventoryItem, Partner } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import { SeatingAreaSelector } from "./components/SeatingAreaSelector";
import { ProductSelector } from "./components/ProductSelector";
import { Cart } from "./components/Cart";
import { SubmitOrderModal } from "./components/SubmitOrderModal";

// Define simplified SalePayload inline
interface AcaiaSalePayload { /* ... */ }

// --- REMOVED ProductWithNumberPrices type ---
// --- REMOVED ActiveVisitInfo type (can use SeatingAreaWithVisitInfo['visits'][number] | null if needed) ---
// --- REMOVED CartItemWithNumberPrices type ---


function PosClientPage() {
  // --- FIX: Use Product type from lib/types ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisitInfo | null>(null);
  // Simplify activeVisit state if only name/id needed
  const [activeVisitInfo, setActiveVisitInfo] = useState<SeatingAreaWithVisitInfo['visits'][number] | null>(null);
  // --- FIX: Use CartItem type from lib/types ---
  const [cart, setCart] = useState<CartItem[]>([]);

  const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] = useDisclosure(false);

  // Fetch only products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products"); // API should return serialized Product[] with number prices
      if (!response.ok) throw new Error("Falha ao buscar produtos");
      const result: ApiResponse<Product[]> = await response.json(); // Expect Product[] from lib/types
      if (result.success && result.data) {
          setProducts(result.data); // Directly set the state
      } else {
        throw new Error(result.error || "Não foi possível carregar produtos");
      }
    } catch (error: any) {
        // ... error handling ...
       setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSelectArea = (area: SeatingAreaWithVisitInfo | null) => {
    setSelectedArea(area);
    setActiveVisitInfo(area?.visits?.[0] || null); // Simplify setting active visit info
  };

  const resetOrder = () => { /* ... unchanged ... */ };

  // Calculation uses number prices from Product type
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);

  const handleSubmitOrder = async () => { /* ... unchanged ... */ };

  const clientName = activeVisitInfo?.client?.name || (activeVisitInfo ? `Cliente Anônimo (Visita #${activeVisitInfo.id})` : "Nenhum cliente ativo");

   // --- FIX: Use Product type from lib/types ---
   const handleAddProduct = (product: Product) => { // Parameter uses Product type
       setCart((currentCart) => {
           const existing = currentCart.find((i) => i.product.id === product.id);
           if (existing) {
               return currentCart.map((i) =>
                   i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
               );
           }
           // Use CartItem type directly
           return [...currentCart, { product: product, quantity: 1 }];
       });
   };

  return (
    <>
      {/* --- FIX: Remove type assertion for cart --- */}
      <SubmitOrderModal opened={submitModal} onClose={closeSubmitModal} onSubmit={handleSubmitOrder} seatingAreaName={selectedArea?.name || ''} clientName={clientName} cart={cart} total={cartTotal} loading={loadingSubmit} />
      <Stack>
        <PageHeader title="Nova Comanda" />
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* LEFT COLUMN */}
          <Paper withBorder p="md" radius="md">
            <Stack>
              {/* ... SeatingAreaSelector and clientName display ... */}
              <SeatingAreaSelector selectedAreaId={selectedArea?.id || null} onSelect={handleSelectArea} disabled={loadingProducts} />
               {selectedArea && (<Text size="sm" c="dimmed">Cliente Atual: {clientName}</Text>)}
              <Group gap="xs" mt="lg" mb="sm"><Package size={24} /><Title order={4}>2. Adicionar Produtos</Title></Group>
              {/* --- FIX: Remove type assertion for products --- */}
              <ProductSelector products={products} loading={loadingProducts} onAddProduct={handleAddProduct} />
            </Stack>
          </Paper>
          {/* RIGHT COLUMN */}
          <Paper withBorder p="md" radius="md">
            <Stack h="100%">
             {/* ... Cart Header ... */}
              <Stack h="100%" justify="space-between" style={{ flexGrow: 1}}>
                 {/* --- FIX: Remove type assertion for cart/setCart --- */}
                 {/* Ensure Cart component expects CartItem[] from lib/types */}
                <Cart cart={cart} onSetCart={setCart} />
                {/* ... Cart Footer / Submit Button ... */}
              </Stack>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </>
  );
}

export default function PosPage() {
  return <PosClientPage />;
}