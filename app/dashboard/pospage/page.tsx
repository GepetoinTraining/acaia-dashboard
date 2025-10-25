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
// Import the specific type from lib/types
import { ApiResponse, CartItem, SeatingAreaWithVisitInfo } from "@/lib/types";
// Import base Prisma types + Enums needed
import { Product, Visit, Client, SeatingArea, ProductType, PrepStation } from "@prisma/client";
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
};

// Define the type for the simplified visit info used in this component's state
type ActiveVisitInfo = {
    id: number;
    clientId: number | null;
    client: { name: string | null } | null;
} | null; // Allow null

function PosClientPage() {
  // --- FIX: Use ProductWithNumberPrices for state ---
  const [products, setProducts] = useState<ProductWithNumberPrices[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisitInfo | null>(null);
  const [activeVisitInfo, setActiveVisitInfo] = useState<ActiveVisitInfo>(null);
  // --- FIX: CartItem product should also use ProductWithNumberPrices ---
  const [cart, setCart] = useState<CartItem[]>([]); // CartItem type uses Product, adjust if needed

  const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] =
    useDisclosure(false);

  // Fetch only products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Falha ao buscar produtos");
      const result: ApiResponse<Product[]> = await response.json(); // API returns serialized Product[]
      if (result.success && result.data) {
          // Deserialize prices to numbers
          const deserializedProducts: ProductWithNumberPrices[] = result.data.map(p => ({
              ...p,
              costPrice: Number(p.costPrice || 0),
              salePrice: Number(p.salePrice || 0),
              deductionAmountInSmallestUnit: Number(p.deductionAmountInSmallestUnit || 1),
          }));
        setProducts(deserializedProducts); // Set state with correct type
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
    (acc, item) => acc + (item.product.salePrice * item.quantity), // Direct multiplication
    0
  );

  // Handle order submission
  const handleSubmitOrder = async () => {
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

  // --- FIX: Adjust CartItem type if necessary ---
  // The Cart component expects CartItem[], where CartItem has a 'product: Product'.
  // Since our 'products' state uses ProductWithNumberPrices, we need consistency.
  // Option 1: Update CartItem definition in lib/types.ts to use ProductWithNumberPrices (or a similar serialized type).
  // Option 2: Cast the product when adding to cart (less type-safe).
  // Let's assume Cart component can handle number prices (as it uses Number() internally).
  // The type mismatch might be ignored by TS if structures are similar enough, but explicit typing is better.
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
           // Explicitly create CartItem, ensure product matches CartItem's expected product type
           // If CartItem expects Prisma's Product (with Decimal), conversion needed here.
           // Assuming Cart handles number prices:
           return [...currentCart, { product: product as Product, quantity: 1 }]; // Use type assertion
       });
   };


  return (
    <>
      <SubmitOrderModal opened={submitModal} onClose={closeSubmitModal} onSubmit={handleSubmitOrder} seatingAreaName={selectedArea?.name || ''} clientName={clientName} cart={cart} total={cartTotal} loading={loadingSubmit} />
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
              <ProductSelector products={products as Product[]} loading={loadingProducts} onAddProduct={handleAddProduct} /> {/* Assert products type */}
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
                <Cart cart={cart} onSetCart={setCart} />
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