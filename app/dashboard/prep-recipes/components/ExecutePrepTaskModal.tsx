
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Stack,
  LoadingOverlay,
  NumberInput,
  Text,
  Title,
  Select,
  Textarea, // Added for notes
  Group,
  List,
  ThemeIcon
} from "@mantine/core";
import { IconCircleCheck, IconCircleX, IconExclamationCircle } from "@tabler/icons-react"; // Added icons
import { useForm } from "@mantine/form";
import { ApiResponse, SerializedPrepRecipe, SerializedStockHolding } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import { Decimal } from "@prisma/client/runtime/library"; // Use for calculations
import { useQuery } from "@tanstack/react-query";

type StockLocation = { id: string; name: string };

interface ExecutePrepTaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prepRecipe: SerializedPrepRecipe | null;
  locations: StockLocation[]; // Pass available storage locations
}

// Helper to fetch current stock for required ingredients at a location
const fetchInputStock = async (ingredientIds: string[], locationId: string): Promise<Map<string, Decimal>> => {
    const params = new URLSearchParams({ venueObjectId: locationId });
    ingredientIds.forEach(id => params.append('ingredientId', id)); // Filter by multiple ingredient IDs if API supports, otherwise fetch all for location

    const res = await fetch(`/api/stock-holdings?${params.toString()}`);
    const result: ApiResponse<SerializedStockHolding[]> = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || "Falha ao buscar estoque atual");

    const stockMap = new Map<string, Decimal>();
    result.data?.forEach(holding => {
        const current = stockMap.get(holding.ingredientId) ?? new Decimal(0);
        stockMap.set(holding.ingredientId, current.plus(holding.quantity));
    });
    return stockMap;
};


export function ExecutePrepTaskModal({
  opened,
  onClose,
  onSuccess,
  prepRecipe,
  locations,
}: ExecutePrepTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedInputs, setCalculatedInputs] = useState<{ ingredient: { name: string; unit: string; id: string }, required: Decimal }[]>([]);

  const form = useForm({
    initialValues: {
      quantityRun: "", // Start empty, user enters desired output qty
      locationId: null as string | null,
      notes: "",
    },
    validate: {
      quantityRun: (value) => {
          try {
              const num = new Decimal(value);
              return num.gt(0) ? null : "Quantidade deve ser positiva";
          } catch {
              return "Quantidade inválida";
          }
      },
      locationId: (val) => (val ? null : "Localização é obrigatória"),
    },
  });

  const selectedLocationId = form.values.locationId;
  const quantityRunValue = form.values.quantityRun;

  // Fetch current stock for required inputs when location or recipe changes
  const { data: currentInputStock, isLoading: isLoadingStock } = useQuery({
      queryKey: ['inputStock', prepRecipe?.id, selectedLocationId],
      queryFn: () => {
          if (!prepRecipe || !selectedLocationId) return new Map<string, Decimal>();
          const inputIds = prepRecipe.inputs.map(inp => inp.ingredient.id);
          return fetchInputStock(inputIds, selectedLocationId);
      },
      enabled: !!prepRecipe && !!selectedLocationId && opened, // Only run when modal is open and deps are ready
      placeholderData: new Map<string, Decimal>(), // Provide initial empty map
  });


  // Recalculate required inputs when quantityRun or prepRecipe changes
  useEffect(() => {
    if (prepRecipe && quantityRunValue) {
      try {
        const quantityRunDecimal = new Decimal(quantityRunValue);
        const outputQuantityDecimal = new Decimal(prepRecipe.outputQuantity);

        if (quantityRunDecimal.gt(0) && outputQuantityDecimal.gt(0)) {
          const runs = quantityRunDecimal.dividedBy(outputQuantityDecimal);
          const required = prepRecipe.inputs.map(input => {
             const inputQuantityDecimal = new Decimal(input.quantity);
             return {
                ingredient: input.ingredient,
                required: inputQuantityDecimal.times(runs),
             };
          });
          setCalculatedInputs(required);
        } else {
          setCalculatedInputs([]);
        }
      } catch {
        setCalculatedInputs([]); // Handle invalid number input
      }
    } else {
      setCalculatedInputs([]);
    }
  }, [quantityRunValue, prepRecipe]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    const payload = {
      prepRecipeId: prepRecipe!.id,
      quantityRun: values.quantityRun, // Send as string, API handles Decimal
      locationId: values.locationId,
      notes: values.notes,
    };

    try {
      const response = await fetch("/api/prep-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao registrar tarefa de preparo");

      notifications.show({
        title: "Sucesso!",
        message: `Tarefa de preparo para "${prepRecipe!.name}" registrada. Estoque atualizado.`,
        color: "green",
      });
      onSuccess(); // Close modal and refresh relevant data via parent
    } catch (error: any) {
      notifications.show({
        title: "Erro",
        message: error.message,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setCalculatedInputs([]);
    onClose();
  };

  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }));

  // Check if there is enough stock for each required input
  const stockCheckResults = calculatedInputs.map(input => {
      const available = currentInputStock?.get(input.ingredient.id) ?? new Decimal(0);
      const sufficient = available.gte(input.required);
      return { ...input, available, sufficient };
  });
  const hasInsufficientStock = selectedLocationId && !isLoadingStock && stockCheckResults.some(res => !res.sufficient);


  if (!prepRecipe) return null; // Should not happen if opened correctly

  return (
    <Modal opened={opened} onClose={handleClose} title={`Executar Preparo: ${prepRecipe.name}`} centered size="lg">
      <LoadingOverlay visible={isSubmitting || isLoadingStock} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Title order={5}>Produzir:</Title>
          <Text>{prepRecipe.outputIngredient.name} ({prepRecipe.outputIngredient.unit})</Text>

          <Group grow>
             <NumberInput
                required
                label="Quantidade a Produzir"
                description={`Em ${prepRecipe.outputIngredient.unit}`}
                placeholder="Ex: 500 (para 500g ou 500ml)"
                min={0.001}
                decimalScale={3}
                {...form.getInputProps("quantityRun")}
            />
            <Select
                required
                label="Localização da Produção/Armazenagem"
                placeholder="Onde o preparo acontece?"
                data={locationOptions}
                {...form.getInputProps("locationId")}
                searchable
                withinPortal
            />
          </Group>

          {calculatedInputs.length > 0 && (
             <>
                <Title order={5} mt="md">Ingredientes Necessários:</Title>
                 {hasInsufficientStock && (
                     <Alert color="red" title="Estoque Insuficiente" icon={<IconExclamationCircle/>}>
                         Não há estoque suficiente de um ou mais ingredientes na localização selecionada para esta quantidade. Verifique abaixo.
                     </Alert>
                 )}
                 <List spacing="xs" size="sm" center>
                    {stockCheckResults.map(input => {
                        const availableFormatted = input.available.toFixed(3, Decimal.ROUND_DOWN);
                        const requiredFormatted = input.required.toFixed(3, Decimal.ROUND_UP); // Round up required amount for display
                        return (
                             <List.Item
                                key={input.ingredient.id}
                                icon={
                                  <ThemeIcon color={input.sufficient ? 'teal' : 'red'} size={18} radius="xl">
                                    {input.sufficient ? <IconCircleCheck size="0.8rem" /> : <IconCircleX size="0.8rem" />}
                                  </ThemeIcon>
                                }
                             >
                                <Text span fw={500}>{input.ingredient.name}</Text>: {requiredFormatted} {input.ingredient.unit}
                                <Text span size="xs" c="dimmed" ml="xs">(Disp: {availableFormatted})</Text>
                             </List.Item>
                        );
                    })}
                </List>
             </>
          )}

          <Textarea
            label="Notas (Opcional)"
            placeholder="Ex: Lote do fornecedor X, preparado por Y"
            {...form.getInputProps('notes')}
            minRows={2}
            mt="md"
          />

          <Button
            type="submit"
            mt="xl"
            color="green"
            loading={isSubmitting}
            disabled={!form.isValid() || hasInsufficientStock || isLoadingStock} // Disable if form invalid, not enough stock, or stock check loading
           >
            Registrar Produção e Ajustar Estoque
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}