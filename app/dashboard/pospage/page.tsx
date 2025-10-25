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
// --- FIX: Import SeatingAreaWithVisitInfo ---
import { ApiResponse, LiveData, CartItem, SeatingAreaWithVisitInfo } from "@/lib/types";
import { Product, Visit, Client, SeatingArea } from "@prisma/client"; // Keep base types if needed elsewhere
import { notifications } from "@mantine/notifications";
import { SeatingAreaSelector } from "./components/SeatingAreaSelector"; // Correct component
import { ProductSelector } from "./components/ProductSelector";
import { Cart } from "./components/Cart";
import { SubmitOrderModal } from "./components/SubmitOrderModal";

// --- REMOVED Local SeatingAreaWithVisit type definition ---
// type SeatingAreaWithVisit = SeatingArea & {
//     visits: (Visit & { client: Client | null })[];
// };

// Define simplified SalePayload inline
interface AcaiaSalePayload {
  seatingAreaId: number;
  cart: {
    productId: number;
    quantity: number;
  }[];
}

function PosClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // --- FIX: Use SeatingAreaWithVisitInfo for state ---
  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisitInfo | null>(null);
  // activeVisit can be simplified or derived directly from selectedArea if needed
  const [activeVisitInfo, setActiveVisitInfo] = useState<{ id: number; clientId: number | null; client: { name: string | null } | null } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] =
    useDisclosure(false);

  // Fetch only products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Falha ao buscar produtos");
      // Expect Product[] but prices might be numbers due to API serialization
      const result: ApiResponse<Product[]> = await response.json();
      if (result.success && result.data) {
          // Deserialize prices back to numbers if needed by Cart/ProductSelector
          const deserializedProducts = result.data.map(p => ({
              ...p,
              // Convert string prices back to numbers
              costPrice: Number(p.costPrice || 0),
              salePrice: Number(p.salePrice || 0),
              deductionAmountInSmallestUnit: Number(p.deductionAmountInSmallestUnit || 1),
          }));
        setProducts(deserializedProducts);
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
       setProducts([]); // Clear on error
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- FIX: Update function signature to use SeatingAreaWithVisitInfo ---
  // Handle Seating Area Selection
  const handleSelectArea = (area: SeatingAreaWithVisitInfo | null) => {
    setSelectedArea(area);
    // Use the simplified visit info from the selected area
    if (area && area.visits.length > 0) {
      setActiveVisitInfo(area.visits[0]);
    } else {
      setActiveVisitInfo(null);
    }
    // Optionally reset cart
    // setCart([]);
  };

  // Reset order state
  const resetOrder = () => {
    setSelectedArea(null);
    setActiveVisitInfo(null); // Reset simplified info
    setCart([]);
    closeSubmitModal();
  };

  // Calculate cart total (using Number conversion)
  const cartTotal = cart.reduce(
    (acc, item) => acc + (Number(item.product.salePrice) * item.quantity),
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

     const payload: AcaiaSalePayload = { // Ensure payload matches interface
        seatingAreaId: selectedArea.id,
        cart: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
        })),
     };

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();
      if (!response.ok) {
          throw new Error(result.error || "Falha ao registrar pedido");
      }

      notifications.show({
        title: "Pedido Enviado!",
        message: `Pedido para ${selectedArea.name} enviado com sucesso.`,
        color: "green",
      });
      resetOrder();
      // TODO: Consider triggering a refetch of seating areas to update occupancy status in the selector
      // Maybe add a refresh function prop to SeatingAreaSelector? For MVP, manual refresh is okay.
    } catch (error: any) {
      notifications.show({
        title: "Erro ao Enviar Pedido",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoadingSubmit(false);
      closeSubmitModal();
    }
  };


  // Determine client name from the simplified activeVisitInfo
  const clientName = activeVisitInfo?.client?.name || (activeVisitInfo ? `Cliente Anônimo (Visita #${activeVisitInfo.id})` : "Nenhum cliente ativo");

  return (
    <>
      <SubmitOrderModal
        opened={submitModal}
        onClose={closeSubmitModal}
        onSubmit={handleSubmitOrder}
        seatingAreaName={selectedArea?.name || ''}
        clientName={clientName}
        cart={cart}
        total={cartTotal}
        loading={loadingSubmit}
      />

      <Stack>
        <PageHeader title="Nova Comanda" />

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* LEFT COLUMN: Order Setup */}
          <Paper withBorder p="md" radius="md">
            <Stack>
              <Group gap="xs" mb="sm">
                  <MapPin size={24} />
                  <Title order={4}>1. Selecionar Mesa / Área</Title>
              </Group>
              {/* Ensure SeatingAreaSelector's onSelect prop type matches handleSelectArea */}
              <SeatingAreaSelector
                selectedAreaId={selectedArea?.id || null}
                onSelect={handleSelectArea}
                disabled={loadingProducts}
              />
               {selectedArea && (
                  <Text size="sm" c="dimmed">
                     Cliente Atual: {clientName}
                  </Text>
               )}


              <Group gap="xs" mt="lg" mb="sm">
                  <Package size={24} />
                  <Title order={4}>2. Adicionar Produtos</Title>
              </Group>
              <ProductSelector
                products={products}
                loading={loadingProducts}
                onAddProduct={(product) => {
                  setCart((currentCart) => {
                    const existing = currentCart.find(
                      (i) => i.product.id === product.id
                    );
                    if (existing) {
                      return currentCart.map((i) =>
                        i.product.id === product.id
                          ? { ...i, quantity: i.quantity + 1 }
                          : i
                      );
                    }
                    return [...currentCart, { product, quantity: 1 }];
                  });
                }}
              />
            </Stack>
          </Paper>

          {/* RIGHT COLUMN: Cart & Submit */}
          <Paper withBorder p="md" radius="md">
            <Stack h="100%">
              <Group justify="space-between">
                 <Group gap="xs">
                     <ShoppingCart size={24}/>
                     <Title order={4}>3. Comanda Atual</Title>
                 </Group>
                <Button
                  variant="outline"
                  color="red"
                  size="xs"
                  onClick={resetOrder}
                  leftSection={<Trash2 size={14}/>}
                  disabled={cart.length === 0 && !selectedArea}
                >
                  Limpar
                </Button>
              </Group>

              <Stack h="100%" justify="space-between" style={{ flexGrow: 1}}>
                <Cart cart={cart} onSetCart={setCart} />

                <Stack mt="md">
                  <Divider />
                  <Group justify="space-between">
                    <Text size="xl" fw={700}>
                      Total:
                    </Text>
                    <Text size="xl" fw={700} c="pastelGreen.9">
                      R$ {cartTotal.toFixed(2)}
                    </Text>
                  </Group>
                  <Button
                    color="green"
                    size="lg"
                    leftSection={<Send size={20} />}
                    onClick={openSubmitModal}
                    disabled={
                      !selectedArea || cart.length === 0 || loadingSubmit
                    }
                    loading={loadingSubmit}
                  >
                    Enviar Pedido
                  </Button>
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