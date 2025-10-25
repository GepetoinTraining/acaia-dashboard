// File: app/dashboard/promotions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Stack, Group, Button, LoadingOverlay } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Plus } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { ApiResponse, Product } from "@/lib/types"; // Use client-side Product
import { Promotion } from "@prisma/client"; // Keep base Promotion type
import { notifications } from "@mantine/notifications";
import { CreatePromotionModal } from "./components/CreatePromotionModal";
import { PromotionTable } from "./components/PromotionTable";

// --- FIX: Add 'export' to this type definition ---
export type PromotionWithProduct = Promotion & {
    product: Product | null; // Use client-side Product type
};

export default function PromotionsPage() {
  // --- FIX: Use PromotionWithProduct type ---
  const [promotions, setPromotions] = useState<PromotionWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Use client-side Product
  const [loading, setLoading] = useState(true);
  const [createModal, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch promotions (assuming API returns PromotionWithProduct)
      const promoRes = await fetch("/api/promotions");
      if (!promoRes.ok) throw new Error("Falha ao buscar promoções");
      const promoResult: ApiResponse<PromotionWithProduct[]> = await promoRes.json();
      
      // Fetch products (API returns client-side Product)
      const prodRes = await fetch("/api/products");
      if (!prodRes.ok) throw new Error("Falha ao buscar produtos");
      const prodResult: ApiResponse<Product[]> = await prodRes.json();

      if (promoResult.success && promoResult.data) {
        setPromotions(promoResult.data);
      } else {
        throw new Error(promoResult.error || "Não foi possível carregar promoções");
      }

      if (prodResult.success && prodResult.data) {
        setProducts(prodResult.data);
      } else {
        throw new Error(prodResult.error || "Não foi possível carregar produtos");
      }

    } catch (error: any) {
      notifications.show({
        title: "Erro",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePromotionCreated = (newPromotion: PromotionWithProduct) => {
    setPromotions(current => [...current, newPromotion]);
    fetchData(); // Or just add to state, but refetch ensures consistency
  };

  return (
    <>
      <CreatePromotionModal
        opened={createModal}
        onClose={closeCreateModal}
        products={products} // Pass client-side Product[]
        onPromotionCreated={handlePromotionCreated}
      />
      <Stack>
        <PageHeader title="Promoções">
          <Button leftSection={<Plus size={18} />} onClick={openCreateModal}>
            Criar Promoção
          </Button>
        </PageHeader>

        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} zIndex={10} overlayProps={{ radius: "sm", blur: 2 }} />
          <PromotionTable promotions={promotions} /> 
        </div>
      </Stack>
    </>
  );
}