"use client";

import { Button, Stack } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Plus, Megaphone } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { PromotionBulletin, Product } from "@prisma/client";
import { CreatePromotionModal } from "./components/CreatePromotionModal";
import { PromotionTable } from "./components/PromotionTable";

// Extend type to include product name
export type PromotionWithProduct = PromotionBulletin & {
  product: Product | null;
};

function PromotionsClientPage() {
  const [promotions, setPromotions] = useState<PromotionWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/promotions");
      if (!response.ok) throw new Error("Failed to fetch promotions");
      const result: ApiResponse<PromotionWithProduct[]> =
        await response.json();
      if (result.success && result.data) {
        setPromotions(result.data);
      }
    } catch (error) {
      console.error(error);
      // TODO: Show notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  return (
    <>
      <CreatePromotionModal
        opened={opened}
        onClose={close}
        onSuccess={() => {
          close();
          fetchPromotions(); // Refresh the table
        }}
      />
      <Stack>
        <PageHeader
          title="Promoções (Hostess)"
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={open}
              color="privacyGold"
            >
              Criar Promoção
            </Button>
          }
        />
        <PromotionTable promotions={promotions} loading={loading} />
      </Stack>
    </>
  );
}

export default function PromotionsPage() {
  return <PromotionsClientPage />;
}
