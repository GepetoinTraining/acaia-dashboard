"use client";

import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  LoadingOverlay,
  NumberInput,
  SegmentedControl,
  Paper,
  Title // Added Title import
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { InventoryItem, Partner, Product, Prisma } from "@prisma/client"; // Added Prisma
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";

type CreateProductModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type SelectData = { label: string; value: string };

export function CreateProductModal({
  opened,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<"own" | "consignment">("own");

  // Data for dropdowns
  const [inventoryItems, setInventoryItems] = useState<SelectData[]>([]);
  const [partners, setPartners] = useState<SelectData[]>([]);

  const form = useForm({
    initialValues: {
      name: "",
      category: "",
      costPrice: 0,
      salePrice: 0,
      inventoryItemId: null as string | null,
      deductionAmount: 1,
      partnerId: null as string | null,
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? "Nome inválido" : null),
      salePrice: (val) => (val <= 0 ? "Preço de venda deve ser positivo" : null),
      // Cost price validation depends on type, handle in submit or adjust here
      costPrice: (val, values) => {
        if (val === null || val === undefined || val < 0) return "Custo não pode ser negativo";
        // If consignment and partner selected, cost price (amount due) could be 0, but usually not negative
        if (productType === 'consignment' && !values.partnerId) return null; // Ignore if partner not yet selected
        return null;
      },
      inventoryItemId: (val) => (!val ? "Item de estoque é obrigatório" : null),
      deductionAmount: (val) => (val <= 0 ? "Quantidade a deduzir deve ser positiva" : null), // Added validation
      partnerId: (val) => (productType === "consignment" && !val ? "Parceiro é obrigatório" : null),
    },
  });

  // Fetch data for dropdowns when modal opens
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const fetchData = async () => {
      try {
        // Fetch inventory items
        const itemsRes = await fetch("/api/inventory/items");
        const itemsResult: ApiResponse<InventoryItem[]> = await itemsRes.json();
        if (isMounted && itemsResult.success && itemsResult.data) {
          setInventoryItems(
            itemsResult.data.map((item) => ({
              label: `${item.name} (${item.storageUnitName || 'Unidade'})`, // Added fallback for storageUnitName
              value: item.id.toString(),
            }))
          );
        }

        // Fetch partners
        const partnersRes = await fetch("/api/partners");
        const partnersResult: ApiResponse<Partner[]> = await partnersRes.json();
        if (isMounted && partnersResult.success && partnersResult.data) {
          setPartners(
            partnersResult.data.map((partner) => ({
              label: partner.companyName,
              value: partner.id.toString(),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
        if (isMounted) {
            notifications.show({
                title: "Erro ao carregar dados",
                message: "Não foi possível buscar itens de inventário ou parceiros.",
                color: "red",
            });
        }
      }
    };


    if (opened) {
      fetchData();
    } else {
      // Reset form when modal closes
      form.reset();
      setProductType("own");
      // Clear dropdowns too if desired
      // setInventoryItems([]);
      // setPartners([]);
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [opened]); // Dependency array includes 'opened'

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);

    // Ensure numeric conversion just before sending
    const payload = {
      ...values,
      costPrice: Number(values.costPrice) || 0,
      salePrice: Number(values.salePrice) || 0,
      deductionAmount: Number(values.deductionAmount) || 1,
      partnerId: productType === "own" ? null : values.partnerId,
      inventoryItemId: values.inventoryItemId ? parseInt(values.inventoryItemId) : null,
    };

    // Double-check required fields based on type
     if (payload.inventoryItemId === null) {
       notifications.show({ title: "Erro", message: "Item de estoque é obrigatório.", color: "red" });
       setLoading(false);
       return;
     }
     if (productType === 'consignment' && payload.partnerId === null) {
         notifications.show({ title: "Erro", message: "Parceiro é obrigatório para item consignado.", color: "red" });
         setLoading(false);
         return;
     }


    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<Product> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao criar produto");

      notifications.show({
        title: "Sucesso!",
        message: `Produto "${values.name}" criado.`,
        color: "green",
      });
      onSuccess(); // Closes modal and refreshes data in parent
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

  // Reset partnerId if switching from consignment to own
  const handleTypeChange = (value: string) => {
    const newType = value as "own" | "consignment";
    setProductType(newType);
    if (newType === "own") {
      form.setFieldValue('partnerId', null);
      form.setFieldValue('costPrice', 0); // Reset cost price for own stock? Or maybe keep it? Depends on workflow.
      form.clearFieldError('partnerId'); // Clear potential validation error
    } else {
        form.setFieldValue('costPrice', 0); // Reset cost for consignment, as it might be different
    }
  };


  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Adicionar Novo Produto (Menu)"
      centered
      size="lg"
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <SegmentedControl
            fullWidth
            color="privacyGold"
            value={productType}
            // Remove explicit type on `val`, use assertion on setter
            onChange={(val) => handleTypeChange(val as "own" | "consignment")}
            data={[
              { label: "Estoque Próprio", value: "own" },
              { label: "Consignado (Parceiro)", value: "consignment" },
            ]}
          />

          <TextInput
            required
            label="Nome do Produto"
            placeholder="Ex: Dose JW Black"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Categoria"
            placeholder="Ex: Whisky, Vodka, Cigarro"
            {...form.getInputProps("category")}
          />
          <NumberInput
            required
            label="Preço de Venda (R$)"
            placeholder="Preço no menu para o cliente"
            min={0}
            step={0.01} // Allow cents
            decimalScale={2}
            fixedDecimalScale
            {...form.getInputProps("salePrice")}
          />

          {productType === "consignment" && (
            <Paper p="md" withBorder>
              <Stack>
                <Title order={5}>Detalhes da Consignação</Title>
                <Select
                  required
                  label="Parceiro (Dono do produto)"
                  placeholder="Selecione o parceiro"
                  data={partners}
                  searchable
                  clearable // Allow clearing partner selection
                  {...form.getInputProps("partnerId")}
                />
                <NumberInput
                  required
                  label="Valor Devido ao Parceiro (R$)"
                  description="Quanto o clube deve ao parceiro por esta venda."
                  min={0}
                  step={0.01} // Allow cents
                  decimalScale={2}
                  fixedDecimalScale
                  {...form.getInputProps("costPrice")}
                />
              </Stack>
            </Paper>
          )}

          {productType === "own" && (
             <Paper p="md" withBorder>
                <Stack> {/* Added Stack for consistency */}
                    <Title order={5}>Detalhes do Estoque Próprio</Title>
                    <NumberInput
                    required
                    label="Custo do Produto (R$)"
                    description="Quanto o clube pagou por este item (para cálculo de lucro)."
                    min={0}
                    step={0.01} // Allow cents
                    decimalScale={2}
                    fixedDecimalScale
                    {...form.getInputProps("costPrice")}
                    />
                 </Stack>
             </Paper>
          )}

          <Paper p="md" withBorder mt="md">
             <Stack> {/* Added Stack for consistency */}
                <Title order={5}>Vínculo de Estoque</Title>
                <Select
                  required
                  label="Item de Estoque Físico"
                  description="Qual item físico será deduzido quando este produto for vendido?"
                  placeholder="Selecione o item do inventário"
                  data={inventoryItems}
                  searchable
                  clearable // Allow clearing selection
                  {...form.getInputProps("inventoryItemId")}
                />
                <NumberInput
                  required
                  label="Quantidade a Deduzir"
                  description="Ex: '50' para 50ml, '1' para 1 unidade/garrafa"
                  min={0.01} // Should deduct at least something
                  step={1} // Default step, adjust if needed
                  decimalScale={2} // Allow fractional deductions if needed (e.g., 0.5 units)
                  {...form.getInputProps("deductionAmount")}
                />
             </Stack>
          </Paper>

          <Button type="submit" mt="md" color="privacyGold" loading={loading}>
            Salvar Produto
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
