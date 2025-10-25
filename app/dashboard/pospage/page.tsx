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
} from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import {
  Calculator,
  User,
  Heart,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import {
  ApiResponse,
  LiveData,
  LiveClient,
  LiveHostess,
  CartItem,
} from "@/lib/types";
import { Product } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import { ClientSelector } from "./components/ClientSelector";
import { HostessSelector } from "./components/HostessSelector";
import { ProductSelector } from "./components/ProductSelector";
import { Cart } from "./components/Cart";
import { CheckoutModal } from "./components/CheckoutModal";

function PosClientPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sale State
  const [selectedClient, setSelectedClient] = useState<LiveClient | null>(null);
  const [selectedHostess, setSelectedHostess] = useState<LiveHostess | null>(
    null
  );
  const [cart, setCart] = useState<CartItem[]>([]);

  const [checkoutModal, { open: openCheckout, close: closeCheckout }] =
    useDisclosure(false);

  const fetchLiveData = async () => {
    // Keep setLoading(true) outside the try block if desired
    // setLoading(true);
    try {
      const response = await fetch("/api/live");
      if (!response.ok) throw new Error("Failed to fetch live data");
      const result: ApiResponse<LiveData> = await response.json();
      if (result.success && result.data) {
        setLiveData(result.data);
      } else {
         // Throw error if data is missing even if success is true
         throw new Error(result.error || "Could not load live data");
      }
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Erro ao carregar dados",
        message: error.message,
        color: "red",
      });
      // Optionally set liveData to null or an empty structure on error
      // setLiveData(null);
    } finally {
      setLoading(false); // Ensure loading is set to false in finally
    }
  };


  useEffect(() => {
    fetchLiveData();
  }, []);

  const resetSale = () => {
    setSelectedClient(null);
    setSelectedHostess(null);
    setCart([]);
    closeCheckout();
    // Refresh live data in case client credit changed
    fetchLiveData();
  };

  // Calculate cart total, converting Decimal to number
  const cartTotal = cart.reduce(
    (acc, item) => acc + (Number(item.product.salePrice) * item.quantity), // Convert salePrice here
    0
  );

  return (
    <>
      {selectedClient && (
        <CheckoutModal
          opened={checkoutModal}
          onClose={closeCheckout}
          onSuccess={resetSale}
          client={selectedClient}
          hostess={selectedHostess}
          cart={cart}
          total={cartTotal} // Pass the calculated number total
        />
      )}

      <Stack>
        <PageHeader title="Caixa (PDV)" />

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {/* LEFT COLUMN: Sale Setup */}
          <Paper withBorder p="md" radius="md">
            <Stack>
              <Title order={4}>1. Selecionar Cliente</Title>
              <ClientSelector
                clients={liveData?.clients || []}
                loading={loading}
                selectedClient={selectedClient}
                onSelect={setSelectedClient}
              />

              <Title order={4} mt="md">
                2. Selecionar Hostess
              </Title>
              <HostessSelector
                hostesses={liveData?.hostesses || []}
                loading={loading}
                selectedHostess={selectedHostess}
                onSelect={setSelectedHostess}
              />

              <Title order={4} mt="md">
                3. Adicionar Produtos
              </Title>
              <ProductSelector
                products={liveData?.products || []}
                loading={loading}
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

          {/* RIGHT COLUMN: Cart & Checkout */}
          <Paper withBorder p="md" radius="md">
            <Stack h="100%">
              <Group justify="space-between">
                <Title order={4}>4. Pedido Atual</Title>
                <Button
                  variant="outline"
                  color="red"
                  size="xs"
                  onClick={resetSale}
                  disabled={cart.length === 0 && !selectedClient && !selectedHostess} // Disable if nothing to reset
                >
                  Limpar Pedido
                </Button>
              </Group>

              <Stack h="100%" justify="space-between">
                <Cart cart={cart} onSetCart={setCart} />

                <Stack>
                  <Divider />
                  <Group justify="space-between">
                    <Text size="xl" fw={700}>
                      Total:
                    </Text>
                    <Text size="xl" fw={700} c="privacyGold.9">
                      R$ {cartTotal.toFixed(2)}
                    </Text>
                  </Group>
                  <Button
                    color="green"
                    size="lg"
                    leftSection={<DollarSign size={20} />}
                    onClick={openCheckout}
                    disabled={
                      !selectedClient || !selectedHostess || cart.length === 0
                    }
                  >
                    Finalizar Pagamento
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
