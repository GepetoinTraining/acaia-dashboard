// File: app/dashboard/promotions/components/CreatePromotionModal.tsx
"use client";

/* // --- COMMENT OUT START ---

import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  LoadingOverlay,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
// PromotionBulletin does not exist
// import { Product, PromotionBulletin } from "@prisma/client";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

// Type does not exist
// type PromotionBulletin = any;
type Product = any; // Placeholder

type CreatePromotionModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type ProductSelectData = { label: string; value: string };

export function CreatePromotionModal({
  opened,
  onClose,
  onSuccess,
}: CreatePromotionModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductSelectData[]>([]);

  const form = useForm({
    initialValues: {
      title: "",
      body: "",
      bonusOffer: "",
      productId: null as string | null,
      expiresAt: dayjs().add(1, "day").toDate(),
    },
    validate: {
      title: (val) => (val.trim().length < 2 ? "Título inválido" : null),
      body: (val) => (val.trim().length < 2 ? "Corpo inválido" : null),
      expiresAt: (val) =>
        dayjs(val).isBefore(dayjs()) ? "Data de expiração deve ser futura" : null,
    },
  });

  // Fetch products for dropdown
  useEffect(() => {
    if (opened) {
      // API route might be commented out too
    //   fetch("/api/products")
    //     .then((res) => res.json())
    //     .then((result: ApiResponse<Product[]>) => {
    //       if (result.success && result.data) {
    //         setProducts(
    //           result.data.map((p) => ({
    //             label: p.name,
    //             value: p.id.toString(),
    //           }))
    //         );
    //       }
    //     });
    } else {
      form.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // API route is likely commented out
    //   const response = await fetch("/api/promotions", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(values),
    //   });

    //   const result: ApiResponse<PromotionBulletin> = await response.json();
    //   if (!response.ok) throw new Error(result.error || "Falha ao criar promoção");

      notifications.show({
        title: "Sucesso! (Simulado)",
        message: "Promoção criada e enviada para as hostesses.",
        color: "green",
      });
      onSuccess();
    } catch (error: any) {
      notifications.show({
        title: "Erro (Simulado)",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Criar Nova Promoção (Desativado)"
      centered
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Título"
            placeholder="Ex: 🔥 2X COMISSÃO! 🔥"
            {...form.getInputProps("title")}
            disabled
          />
          <Textarea
            required
            label="Corpo"
            placeholder="Ex: Vendam a garrafa X e ganhem..."
            {...form.getInputProps("body")}
            disabled
          />
          <TextInput
            label="Oferta Bônus"
            placeholder="Ex: 2x Comissão, R$50 Bonus"
            {...form.getInputProps("bonusOffer")}
             disabled
          />
          <Select
            label="Vincular a um Produto (Opcional)"
            placeholder="Selecione um produto"
            data={products}
            searchable
            clearable
            {...form.getInputProps("productId")}
             disabled
          />
          <DateInput
            required
            label="Expira em"
            valueFormat="DD/MM/YYYY HH:mm"
            {...form.getInputProps("expiresAt")}
             disabled
          />
          <Button type="submit" mt="md" color="pastelGreen" loading={loading} disabled>
            Lançar Promoção (Desativado)
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

*/ // --- COMMENT OUT END ---

// Add a placeholder export to prevent build errors about empty modules
export {};