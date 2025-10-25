// File: app/dashboard/promotions/page.tsx
"use client";

/* // --- COMMENT OUT START ---
import { Button, Stack, Text } from "@mantine/core"; // Added Text
import { PageHeader } from "../components/PageHeader";
import { Plus, Megaphone } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
// PromotionBulletin does not exist
// import { PromotionBulletin, Product } from "@prisma/client";
import { CreatePromotionModal } from "./components/CreatePromotionModal";
import { PromotionTable } from "./components/PromotionTable";

// Extend type to include product name - This type is no longer needed
// export type PromotionWithProduct = PromotionBulletin & {
//   product: Product | null;
// };

function PromotionsClientPage() {
  // const [promotions, setPromotions] = useState<PromotionWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  // const fetchPromotions = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch("/api/promotions");
  //     if (!response.ok) throw new Error("Failed to fetch promotions");
  //     const result: ApiResponse<PromotionWithProduct[]> =
  //       await response.json();
  //     if (result.success && result.data) {
  //       setPromotions(result.data);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     // TODO: Show notification
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   // fetchPromotions(); // Don't fetch
  //    setLoading(false); // Just set loading false
  // }, []);

  return (
    <>
      { / * <CreatePromotionModal
        opened={opened}
        onClose={close}
        onSuccess={() => {
          close();
          // fetchPromotions(); // Refresh the table
        }}
      /> * / }
      <Stack>
        <PageHeader
          title="Promoções (Desativado)" // Updated title
          // actionButton={
          //   <Button
          //     leftSection={<Plus size={16} />}
          //     onClick={open}
          //     color="pastelGreen" // Use theme color
          //     disabled // Disable button
          //   >
          //     Criar Promoção (Desativado)
          //   </Button>
          // }
        />
         <Text c="dimmed">Esta funcionalidade foi removida para o MVP.</Text>
        { / * <PromotionTable promotions={promotions} loading={loading} /> * / }
      </Stack>
    </>
  );
}

export default function PromotionsPage() {
  return <PromotionsClientPage />;
}
*/ // --- COMMENT OUT END ---

// Placeholder component to avoid errors
import { Stack, Text } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";

export default function PromotionsPagePlaceholder() {
    return (
        <Stack>
            <PageHeader title="Promoções (Desativado)" />
            <Text c="dimmed">Esta funcionalidade foi removida para o MVP.</Text>
        </Stack>
    );
}