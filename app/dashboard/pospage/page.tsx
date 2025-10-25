// File: app/dashboard/pospage/page.tsx
"use client";

// --- FIX: Added all necessary Mantine and Lucide imports ---
import { 
    Stack, 
    SimpleGrid, 
    Paper, 
    Text, 
    Group, 
    Title,
    Button 
} from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Package, Users, ShoppingCart, Send } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect, useCallback } from "react";
import { ApiResponse, CartItem, SeatingAreaWithVisitInfo, Product } from "@/lib/types";
// We don't need all the base Prisma types here
// import { Visit, Client, SeatingArea, ProductType, PrepStation, InventoryItem, Partner } from "@prisma/client";
import { notifications } from "@mantine/notifications";
import { SeatingAreaSelector } from "./components/SeatingAreaSelector";
import { ProductSelector } from "./components/ProductSelector";
import { Cart } from "./components/Cart";
import { SubmitOrderModal } from "./components/SubmitOrderModal";

// Note: AcaiaSalePayload is not actually used here,
// the payload is constructed inline in handleSubmitOrder
// interface AcaiaSalePayload { /* ... */ }


function PosClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [selectedArea, setSelectedArea] = useState<SeatingAreaWithVisitInfo | null>(null);
  const [activeVisitInfo, setActiveVisitInfo] = useState<SeatingAreaWithVisitInfo['visits'][number] | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [submitModal, { open: openSubmitModal, close: closeSubmitModal }] = useDisclosure(false);

  // Fetch only products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch("/api/products"); 
      if (!response.ok) throw new Error("Falha ao buscar produtos");
      const result: ApiResponse<Product[]> = await response.json(); 
      if (result.success && result.data) {
          setProducts(result.data);
      } else {
        throw new Error(result.error || "Não foi possível carregar produtos");
      }
    } catch (error: any) {
       notifications.show({
            title: "Erro",
            message: "Não foi possível carregar produtos: " + error.message,
            color: "red",
       });
       setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSelectArea = (area: SeatingAreaWithVisitInfo | null) => {
    setSelectedArea(area);
    setActiveVisitInfo(area?.visits?.[0] || null);
    // Clear cart when changing tables to avoid confusion
    setCart([]);
  };

  // --- FIX: Implemented resetOrder logic ---
  const resetOrder = () => {
    setCart([]);
    setSelectedArea(null);
    setActiveVisitInfo(null);
  };

  // Calculation uses number prices from Product type
  const cartTotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);

  // --- FIX: Implemented handleSubmitOrder logic ---
  const handleSubmitOrder = async () => {
    if (!activeVisitInfo || cart.length === 0) {
      notifications.show({
        title: "Erro",
        message: "Selecione uma mesa com visita ativa e adicione itens ao carrinho.",
        color: "red",
      });
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        visitId: activeVisitInfo.id,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        // staffId will be pulled from session on the server-side (api/sales)
      };

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Falha ao submeter a comanda");
      }

      notifications.show({
        title: "Sucesso!",
        message: "Comanda enviada para a produção!",
        color: "green",
      });

      resetOrder(); // Clear everything
      closeSubmitModal(); // Close the confirmation modal

    } catch (error: any) {
      console.error("handleSubmitOrder error:", error);
      notifications.show({
        title: "Erro na Submissão",
        message: error.message || "Não foi possível enviar a comanda.",
        color: "red",
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const clientName = activeVisitInfo?.client?.name || (activeVisitInfo ? `Cliente Anônimo (Visita #${activeVisitInfo.id})` : "Nenhum cliente ativo");

   const handleAddProduct = (product: Product) => {
       setCart((currentCart) => {
           // Prevent adding items if no table is selected
           if (!activeVisitInfo) {
               notifications.show({
                   title: "Atenção",
                   message: "Por favor, selecione uma mesa/cliente antes de adicionar produtos.",
                   color: "yellow"
               });
               return currentCart;
           }

           const existing = currentCart.find((i) => i.product.id === product.id);
           if (existing) {
               return currentCart.map((i) =>
                   i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
               );
           }
           return [...currentCart, { product: product, quantity: 1 }];
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
              {/* --- FIX: Filled in SeatingAreaSelector section --- */}
              <Group gap="xs" mb="sm">
                <Users size={24} />
                <Title order={4}>1. Selecionar Cliente</Title>
              </Group>
              <SeatingAreaSelector selectedAreaId={selectedArea?.id || null} onSelect={handleSelectArea} disabled={loadingProducts} />
              {selectedArea && (<Text size="sm" c="dimmed" mt="xs">Cliente Atual: {clientName}</Text>)}
              
              <Group gap="xs" mt="lg" mb="sm"><Package size={24} /><Title order={4}>2. Adicionar Produtos</Title></Group>
              <ProductSelector products={products} loading={loadingProducts} onAddProduct={handleAddProduct} />
            </Stack>
          </Paper>
          
          {/* RIGHT COLUMN */}
          <Paper withBorder p="md" radius="md">
            <Stack h="100%">
             {/* --- FIX: Filled in Cart Header --- */}
             <Group justify="space-between" align="center">
                <Group gap="xs">
                  <ShoppingCart size={24} />
                  <Title order={4}>3. Comanda</Title>
                </Group>
                <Button
                  variant="default"
                  size="xs"
                  onClick={resetOrder}
                  disabled={cart.length === 0}
                >
                  Limpar
                </Button>
              </Group>
              
              <Stack h="100%" justify="space-between" style={{ flexGrow: 1}}>
                <Cart cart={cart} onSetCart={setCart} />
                
                {/* --- FIX: Filled in Cart Footer / Submit Button --- */}
                <Stack>
                  <Group justify="space-between" mt="md">
                    <Text fw={500} size="lg">Total:</Text>
                    <Text fw={700} size="lg" c="green">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                    </Text>
                  </Group>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={openSubmitModal}
                    disabled={cart.length === 0 || !activeVisitInfo}
                    leftSection={<Send size={18} />}
                  >
                    Revisar e Enviar Pedido
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