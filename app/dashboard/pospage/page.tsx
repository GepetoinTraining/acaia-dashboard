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
// --- Ensure SeatingAreaWithVisitInfo is imported ---
import { ApiResponse, CartItem, SeatingAreaWithVisitInfo } from "@/lib/types";
import { Product, Visit, Client, SeatingArea, ProductType, PrepStation } from "@prisma/client"; // Added missing enums/types
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

// Define the type for the simplified visit info used in this component's state
type ActiveVisitInfo = {
    id: number;
    clientId: number | null;
    client: { name: string | null } | null;
} | null; // Allow null

function PosClientPage() {
  // Use Product type from Prisma, but remember prices are numbers here
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // --- Ensure state uses the imported type ---
  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisitInfo | null>(null);
  const [activeVisitInfo, setActiveVisitInfo] = useState<ActiveVisitInfo>(null); // Use the defined type
  const [cart, setCart] = useState<CartItem[]>([]);

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
          // Deserialize prices back to numbers
          const deserializedProducts = result.data.map(p => ({
              ...p,
              // Convert string/Decimal representations from API back to numbers
              costPrice: Number(p.costPrice || 0),
              salePrice: Number(p.salePrice || 0),
              deductionAmountInSmallestUnit: Number(p.deductionAmountInSmallestUnit || 1),
          }));
        setProducts(deserializedProducts as unknown as Product[]); // Cast needed as Decimal type is lost
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

  // --- Ensure function signature uses the imported type ---
  const handleSelectArea = (area: SeatingAreaWithVisitInfo | null) => {
    setSelectedArea(area);
    if (area && area.visits.length > 0) {
      // Set state using the simplified structure
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

  // Calculate cart total
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

     const payload: AcaiaSalePayload = {
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
                onSelect={handleSelectArea} // Pass the correctly typed handler
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
                  // Ensure product passed to setCart has correct Price types if needed by Cart
                  // Here we assume Cart handles number prices
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
                    // Ensure the product added to cart matches CartItem type
                    return [...currentCart, { product: product as Product, quantity: 1 }];
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