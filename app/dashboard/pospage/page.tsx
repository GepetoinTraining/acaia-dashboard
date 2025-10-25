// File: app/dashboard/pospage/page.tsx
"use client";

import {
  Button,
  Stack,
  SimpleGrid,
  Group,
  Text,
  Paper,
  Title,
  Divider,
  LoadingOverlay,
  Alert
} from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import {
  Send,
  Package,
  ShoppingCart,
  Trash2,
  MapPin
} from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useCallback } from "react";
import { ApiResponse, CartItem, SeatingAreaWithVisitInfo } from "@/lib/types";
import { Product, Visit, Client, SeatingArea, ProductType, PrepStation, InventoryItem, Partner } from "@prisma/client"; // Added InventoryItem, Partner
import { notifications } from "@mantine/notifications";
import { SeatingAreaSelector } from "./components/SeatingAreaSelector";
import { ProductSelector } from "./components/ProductSelector";
import { Cart } from "./components/Cart";
import { SubmitOrderModal } from "./components/SubmitOrderModal";

// Define simplified SalePayload inline
interface AcaiaSalePayload {
  seatingAreaId: number;
  cart: {
    productId: number;
    quantity: number;
  }[];
}

// Type for the product state after deserializing prices to numbers
type ProductWithNumberPrices = Omit<Product, 'costPrice' | 'salePrice' | 'deductionAmountInSmallestUnit'> & {
    costPrice: number;
    salePrice: number;
    deductionAmountInSmallestUnit: number;
    // Relations might also need serialization if they contain Decimals
    inventoryItem: (Omit<InventoryItem, 'storageUnitSizeInSmallest' | 'reorderThresholdInSmallest'> & {
        storageUnitSizeInSmallest: number | null;
        reorderThresholdInSmallest: number | null;
    }) | null; // Match serialized InventoryItem type used elsewhere
    partner: Partner | null; // Partner doesn't have Decimals
};

// Define the type for the simplified visit info used in this component's state
type ActiveVisitInfo = {
    id: number;
    clientId: number | null;
    client: { name: string | null } | null;
} | null;

// Adjust CartItem to use ProductWithNumberPrices
type CartItemWithNumberPrices = {
    product: ProductWithNumberPrices;
    quantity: number;
};


function PosClientPage() {
  // --- FIX: Initialize state with ProductWithNumberPrices[] ---
  const [products, setProducts] = useState<ProductWithNumberPrices[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisitInfo | null>(null);
  const [activeVisitInfo, setActiveVisitInfo] = useState<ActiveVisitInfo>(null);
  // --- FIX: Use CartItemWithNumberPrices for cart state ---
  const [cart, setCart] = useState<CartItemWithNumberPrices[]>([]);

  const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] =
    useDisclosure(false);

  // Fetch only products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products"); // API returns serialized Product[] with number prices
      if (!response.ok) throw new Error("Falha ao buscar produtos");
      // Expect API to return data where Decimals are already numbers/strings
      const result: ApiResponse<ProductWithNumberPrices[]> = await response.json();
      if (result.success && result.data) {
          // Data from API should already match ProductWithNumberPrices if API serialization is correct
          setProducts(result.data); // Directly set the state
      } else {
        throw new Error(result.error || "Não foi possível carregar produtos");
      }
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Erro ao carregar produtos",
        message: error.message,
        color: "red",
      });
       setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handler uses the imported SeatingAreaWithVisitInfo type
  const handleSelectArea = (area: SeatingAreaWithVisitInfo | null) => {
    setSelectedArea(area);
    if (area && area.visits.length > 0) {
      setActiveVisitInfo(area.visits[0]);
    } else {
      setActiveVisitInfo(null);
    }
  };

  // Reset order state
  const resetOrder = () => {
    setSelectedArea(null);
    setActiveVisitInfo(null);
    setCart([]);
    closeSubmitModal();
  };

  // Calculate cart total (using number prices)
  const cartTotal = cart.reduce(
    (acc, item) => acc + (item.product.salePrice * item.quantity), // Direct multiplication is now safe
    0
  );

  // Handle order submission
  const handleSubmitOrder = async () => {
     // ... (submission logic remains the same) ...
     if (!selectedArea) {
         notifications.show({ title: "Erro", message: "Nenhuma mesa selecionada.", color: "red" });
         return;
     }
     if (cart.length === 0) {
          notifications.show({ title: "Erro", message: "O carrinho está vazio.", color: "red" });
          return;
     }
     setLoadingSubmit(true);
     const payload: AcaiaSalePayload = {
        seatingAreaId: selectedArea.id,
        cart: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
     };
    try {
      const response = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result: ApiResponse = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao registrar pedido");
      notifications.show({ title: "Pedido Enviado!", message: `Pedido para ${selectedArea.name} enviado com sucesso.`, color: "green" });
      resetOrder();
    } catch (error: any) {
      notifications.show({ title: "Erro ao Enviar Pedido", message: error.message, color: "red" });
    } finally {
      setLoadingSubmit(false);
      closeSubmitModal();
    }
  };

  const clientName = activeVisitInfo?.client?.name || (activeVisitInfo ? `Cliente Anônimo (Visita #${activeVisitInfo.id})` : "Nenhum cliente ativo");

   // --- FIX: Use ProductWithNumberPrices in handler ---
   const handleAddProduct = (product: ProductWithNumberPrices) => {
       setCart((currentCart) => {
           const existing = currentCart.find((i) => i.product.id === product.id);
           if (existing) {
               return currentCart.map((i) =>
                   i.product.id === product.id
                       ? { ...i, quantity: i.quantity + 1 }
                       : i
               );
           }
           // Add directly using the correct type
           return [...currentCart, { product: product, quantity: 1 }];
       });
   };


  return (
    <>
      {/* --- FIX: Pass CartItemWithNumberPrices[] to modal and cart --- */}
      <SubmitOrderModal opened={submitModal} onClose={closeSubmitModal} onSubmit={handleSubmitOrder} seatingAreaName={selectedArea?.name || ''} clientName={clientName} cart={cart as CartItem[]} total={cartTotal} loading={loadingSubmit} />
      <Stack>
        <PageHeader title="Nova Comanda" />
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* LEFT COLUMN */}
          <Paper withBorder p="md" radius="md">
            <Stack>
              <Group gap="xs" mb="sm"><MapPin size={24} /><Title order={4}>1. Selecionar Mesa / Área</Title></Group>
              <SeatingAreaSelector selectedAreaId={selectedArea?.id || null} onSelect={handleSelectArea} disabled={loadingProducts} />
              {selectedArea && (<Text size="sm" c="dimmed">Cliente Atual: {clientName}</Text>)}
              <Group gap="xs" mt="lg" mb="sm"><Package size={24} /><Title order={4}>2. Adicionar Produtos</Title></Group>
              {/* --- FIX: Pass ProductWithNumberPrices[] to selector --- */}
              <ProductSelector products={products as Product[]} loading={loadingProducts} onAddProduct={handleAddProduct} />
            </Stack>
          </Paper>
          {/* RIGHT COLUMN */}
          <Paper withBorder p="md" radius="md">
            <Stack h="100%">
              <Group justify="space-between">
                <Group gap="xs"><ShoppingCart size={24}/><Title order={4}>3. Comanda Atual</Title></Group>
                <Button variant="outline" color="red" size="xs" onClick={resetOrder} leftSection={<Trash2 size={14}/>} disabled={cart.length === 0 && !selectedArea}>Limpar</Button>
              </Group>
              <Stack h="100%" justify="space-between" style={{ flexGrow: 1}}>
                 {/* --- FIX: Pass CartItemWithNumberPrices[] to Cart --- */}
                 {/* Ensure Cart component handles number prices */}
                <Cart cart={cart as CartItem[]} onSetCart={setCart as (cart: CartItem[]) => void} />
                <Stack mt="md">
                  <Divider />
                  <Group justify="space-between"><Text size="xl" fw={700}>Total:</Text><Text size="xl" fw={700} c="pastelGreen.9">R$ {cartTotal.toFixed(2)}</Text></Group>
                  <Button color="green" size="lg" leftSection={<Send size={20} />} onClick={openSubmitModal} disabled={!selectedArea || cart.length === 0 || loadingSubmit} loading={loadingSubmit}>Enviar Pedido</Button>
                </Stack>
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