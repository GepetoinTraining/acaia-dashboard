"use client";

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
import { Product, PromotionBulletin } from "@prisma/client";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

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
      fetch("/api/products")
        .then((res) => res.json())
        .then((result: ApiResponse<Product[]>) => {
          if (result.success && result.data) {
            setProducts(
              result.data.map((p) => ({
                label: p.name,
                value: p.id.toString(),
              }))
            );
          }
        });
    } else {
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const response = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result: ApiResponse<PromotionBulletin> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar promoção");

      notifications.show({
        title: "Sucesso!",
        message: "Promoção criada e enviada para as hostesses.",
        color: "green",
      });
      onSuccess();
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Criar Nova Promoção"
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
          />
          <Textarea
            required
            label="Corpo"
            placeholder="Ex: Vendam a garrafa X e ganhem..."
            {...form.getInputProps("body")}
          />
          <TextInput
            label="Oferta Bônus"
            placeholder="Ex: 2x Comissão, R$50 Bonus"
            {...form.getInputProps("bonusOffer")}
          />
          <Select
            label="Vincular a um Produto (Opcional)"
            placeholder="Selecione um produto"
            data={products}
            searchable
            clearable
            {...form.getInputProps("productId")}
          />
          <DateInput
            required
            label="Expira em"
            valueFormat="DD/MM/YYYY HH:mm"
            {...form.getInputProps("expiresAt")}
          />
          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Lançar Promoção
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
