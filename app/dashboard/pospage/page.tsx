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
import { PageHeader } from "../components/PageHeader"; // Adjusted path
import {
  Send, // Changed icon for submit
  Package,
  ShoppingCart,
  Trash2, // Changed icon for reset
  MapPin // Icon for seating area
} from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useCallback } from "react";
import { ApiResponse, LiveData, CartItem } from "@/lib/types"; // Removed LiveClient, LiveHostess
import { Product, Visit, Client, SeatingArea } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import { SeatingAreaSelector } from "./components/SeatingAreaSelector"; // New Component
// Removed HostessSelector, ClientSelector (replaced by SeatingArea logic)
import { ProductSelector } from "./components/ProductSelector";
import { Cart } from "./components/Cart";
// Renaming CheckoutModal to SubmitOrderModal makes sense, but reusing for speed
import { SubmitOrderModal } from "./components/SubmitOrderModal"; // We'll create/rename this next

// Define the shape of the data coming from the API (including the nested visit info)
type SeatingAreaWithVisit = SeatingArea & {
    visits: (Visit & { client: Client | null })[];
};

// Define a simplified SalePayload for Acaia MVP
interface AcaiaSalePayload {
  visitId: number;
  cart: {
    productId: number;
    quantity: number;
  }[];
  // staffId is added on the backend from session
}

function PosClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Order State
  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisit | null>(null);
  const [activeVisit, setActiveVisit] = useState<Visit & { client: Client | null } | null>(null); // Store the active visit for the selected area
  const [cart, setCart] = useState<CartItem[]>([]);

  const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] =
    useDisclosure(false);

  // Fetch only products needed for the selector
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      // Reusing the /api/products endpoint
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Falha ao buscar produtos");
      // Expecting Product[] with relations, though relations might not be needed here
      const result: ApiResponse<Product[]> = await response.json();
      if (result.success && result.data) {
        setProducts(result.data);
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
    } finally {
      setLoadingProducts(false);
    }
  }, []); // Empty dependency array, fetch once

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Seating Area Selection
  const handleSelectArea = (area: SeatingAreaWithVisit | null) => {
    setSelectedArea(area);
    if (area && area.visits.length > 0) {
      // If an active visit exists for this area, set it
      setActiveVisit(area.visits[0]);
    } else {
      // If no active visit, clear it
      setActiveVisit(null);
    }
    // Optionally reset cart when changing tables? Depends on workflow.
    // setCart([]);
  };

  // Reset current order state
  const resetOrder = () => {
    setSelectedArea(null);
    setActiveVisit(null);
    setCart([]);
    closeSubmitModal();
    // No need to refetch products, but might need to refetch seating areas if their status changed
    // For MVP, we assume staff manually selects an available table
  };

  // Calculate cart total, converting Decimal to number
  const cartTotal = cart.reduce(
    (acc, item) => acc + (Number(item.product.salePrice) * item.quantity),
    0
  );

  // Handle the submission of the order
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

     // Determine the visitId: use existing active visit or indicate creation needed
     // For MVP, the backend will handle finding/creating the visit based on seatingAreaId
     // We just need to ensure a seating area is selected.
     // A more robust approach would explicitly pass seatingAreaId and let backend manage visit lifecycle.

     // Let's adjust the payload slightly for clarity on the backend
     const payload = {
        seatingAreaId: selectedArea.id, // Send area ID
        cart: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
        })),
     };

    try {
      const response = await fetch("/api/sales", { // Call the modified sales endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json(); // Expecting simple success/error
      if (!response.ok) {
          throw new Error(result.error || "Falha ao registrar pedido");
      }

      notifications.show({
        title: "Pedido Enviado!",
        message: `Pedido para ${selectedArea.name} enviado com sucesso.`,
        color: "green",
      });
      resetOrder(); // Clear the form after successful submission
      // Might need to trigger a refetch of seating areas if occupancy status changed
    } catch (error: any) {
      notifications.show({
        title: "Erro ao Enviar Pedido",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoadingSubmit(false);
      closeSubmitModal(); // Close modal regardless of success/error
    }
  };


  // Determine client name for display
  const clientName = activeVisit?.client?.name || (activeVisit ? `Cliente Anônimo (Visita #${activeVisit.id})` : "Nenhum cliente ativo");

  return (
    <>
      {/* Reusing/Renaming CheckoutModal */}
      <SubmitOrderModal
        opened={submitModal}
        onClose={closeSubmitModal}
        onSubmit={handleSubmitOrder} // Pass the submit handler
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
              <SeatingAreaSelector
                selectedAreaId={selectedArea?.id || null}
                onSelect={handleSelectArea}
                disabled={loadingProducts} // Disable while products load? Maybe not necessary
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
                products={products} // Use fetched products
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
                    <Text size="xl" fw={700} c="pastelGreen.9"> {/* Use theme color */}
                      R$ {cartTotal.toFixed(2)}
                    </Text>
                  </Group>
                  <Button
                    color="green" // Or use theme color: color="pastelGreen"
                    size="lg"
                    leftSection={<Send size={20} />} // Changed icon
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