// PATH: app/dashboard/products/components/ManageRecipeModal.tsx
// NOTE: This is a NEW FILE.

"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Button,
  Stack,
  LoadingOverlay,
  Select,
  NumberInput,
  Textarea,
  Group,
  ActionIcon,
  Text,
  Title,
  Loader,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { randomId } from "@mantine/hooks"; // Import randomId from @mantine/hooks
import { ApiResponse } from "@/lib/types";
import { ProductWithWorkstation } from "../page";
import { SerializedIngredient } from "../../inventory/page"; // Import from inventory
import { IconTrash } from "@tabler/icons-react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Define types for the form
interface RecipeStepItem {
  key: string;
  stepNumber: number;
  instruction: string;
}
interface RecipeIngredientItem {
  key: string;
  ingredientId: string | null;
  quantity: string;
}
// Full recipe type returned from GET /api/recipes
type FullRecipe = any; 

// Wrapper to provide QueryClient
export function ManageRecipeModal(props: {
  opened: boolean;
  onClose: () => void;
  product: ProductWithWorkstation | null;
}) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <RecipeModalContent {...props} />
    </QueryClientProvider>
  );
}

// Main Modal Content
function RecipeModalContent({
  opened,
  onClose,
  product,
}: {
  opened: boolean;
  onClose: () => void;
  product: ProductWithWorkstation | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingredientsList, setIngredientsList] = useState<SerializedIngredient[]>([]);
  const [isFetchingIngredients, setIsFetchingIngredients] = useState(true);

  // Form setup
  const form = useForm({
    initialValues: {
      notes: "",
      difficulty: 1,
      ingredients: [] as RecipeIngredientItem[],
      steps: [] as RecipeStepItem[],
    },
    validate: {
      ingredients: {
        ingredientId: (value) => (value ? null : "Ingrediente é obrigatório"),
        quantity: (value) => (parseFloat(value) > 0 ? null : "Qtd. inválida"),
      },
      steps: {
        instruction: (value) => (value ? null : "Instrução é obrigatória"),
      },
    },
  });

  // Fetch all available ingredients for the dropdown
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!opened) return;
      setIsFetchingIngredients(true);
      try {
        const response = await fetch("/api/ingredients");
        const data: ApiResponse<SerializedIngredient[]> = await response.json();
        if (data.success && data.data) {
          setIngredientsList(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch ingredients", error);
      } finally {
        setIsFetchingIngredients(false);
      }
    };
    fetchIngredients();
  }, [opened]);

  // Fetch existing recipe data when modal opens
  const {
    data: existingRecipe,
    isLoading: isLoadingRecipe,
    error: recipeError,
    refetch,
  } = useQuery<FullRecipe>({
    queryKey: ["recipe", product?.id],
    queryFn: async () => {
      const response = await fetch(`/api/recipes?productId=${product!.id}`);
      const data: ApiResponse<FullRecipe> = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
      if (response.status === 404) {
        return null; // No recipe found
      }
      throw new Error(data.error || "Failed to fetch recipe");
    },
    enabled: !!product && opened,
  });

  // Populate form with existing recipe data
  useEffect(() => {
    if (existingRecipe) {
      form.setValues({
        notes: existingRecipe.notes || "",
        difficulty: existingRecipe.difficulty || 1,
        ingredients: existingRecipe.ingredients.map((ing: any) => ({
          key: randomId(),
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
        })),
        steps: existingRecipe.steps.map((step: any) => ({
          key: randomId(),
          stepNumber: step.stepNumber,
          instruction: step.instruction,
        })),
      });
    } else {
      form.reset(); // Reset if no recipe
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRecipe]);

  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    if (!product) return;
    setIsSubmitting(true);
    
    // Ensure step numbers are correct
    const finalSteps = values.steps.map((step, index) => ({
        stepNumber: index + 1,
        instruction: step.instruction,
    }));

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          notes: values.notes,
          difficulty: values.difficulty,
          ingredients: values.ingredients,
          steps: finalSteps,
        }),
      });

      const data: ApiResponse = await response.json();

      if (response.ok && data.success) {
        notifications.show({
          title: "Sucesso",
          message: "Receita salva com sucesso!",
          color: "green",
        });
        handleClose();
      } else {
        notifications.show({
          title: "Erro",
          message: data.error || "Falha ao salvar receita",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // --- Form Fields for Ingredients ---
  const ingredientOptions = ingredientsList.map((ing) => ({
    value: ing.id,
    label: `${ing.name} (${ing.unit})`,
  }));

  const ingredientFields = form.values.ingredients.map((item, index) => (
    <Group key={item.key} grow align="flex-start">
      <Select
        label="Ingrediente"
        placeholder="Selecione..."
        data={ingredientOptions}
        {...form.getInputProps(`ingredients.${index}.ingredientId`)}
        searchable
        required
      />
      <NumberInput
        label="Quantidade"
        placeholder="1.5"
        decimalScale={3}
        min={0.001}
        {...form.getInputProps(`ingredients.${index}.quantity`)}
        required
      />
      <ActionIcon
        color="red"
        onClick={() => form.removeListItem("ingredients", index)}
        mt={25}
      >
        <IconTrash size={18} />
      </ActionIcon>
    </Group>
  ));

  // --- Form Fields for Steps ---
  const stepFields = form.values.steps.map((item, index) => (
    <Group key={item.key} grow align="flex-start">
      <Text fw={700} mt={30}>{index + 1}.</Text>
      <TextInput
        label="Instrução"
        placeholder="Ex: Misture os ingredientes"
        {...form.getInputProps(`steps.${index}.instruction`)}
        required
      />
      <ActionIcon
        color="red"
        onClick={() => form.removeListItem("steps", index)}
        mt={25}
      >
        <IconTrash size={18} />
      </ActionIcon>
    </Group>
  ));
  
  const isLoading = isSubmitting || isFetchingIngredients || isLoadingRecipe;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Receita: ${product?.name || ""}`}
      size="xl"
    >
      <LoadingOverlay visible={isLoading} />
      {!product ? (
        <Text>Nenhum produto selecionado.</Text>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {recipeError && (
              <Alert color="red" title="Erro ao carregar receita">
                {(recipeError as Error).message}. Pode não haver uma receita.
              </Alert>
            )}
            
            {/* Ingredients Section */}
            <Title order={4} mt="md">Ingredientes</Title>
            {ingredientFields.length > 0 ? (
              ingredientFields
            ) : (
              <Text c="dimmed">Nenhum ingrediente adicionado.</Text>
            )}
            <Button
              variant="outline"
              onClick={() =>
                form.addListItem("ingredients", {
                  key: randomId(),
                  ingredientId: null,
                  quantity: "1",
                })
              }
            >
              Adicionar Ingrediente
            </Button>

            {/* Steps Section */}
            <Title order={4} mt="lg">Modo de Preparo</Title>
            {stepFields.length > 0 ? (
              stepFields
            ) : (
              <Text c="dimmed">Nenhum passo adicionado.</Text>
            )}
            <Button
              variant="outline"
              onClick={() =>
                form.addListItem("steps", {
                  key: randomId(),
                  stepNumber: form.values.steps.length + 1,
                  instruction: "",
                })
              }
            >
              Adicionar Passo
            </Button>
            
            {/* Other Fields */}
            <Title order={4} mt="lg">Detalhes Adicionais</Title>
            <Textarea
              label="Notas (Opcional)"
              placeholder="Ex: Servir com gelo"
              {...form.getInputProps('notes')}
            />
            <NumberInput
                label="Dificuldade (1-5)"
                min={1}
                max={5}
                {...form.getInputProps('difficulty')}
            />

            <Button type="submit" mt="xl" loading={isSubmitting}>
              Salvar Receita
            </Button>
          </Stack>
        </form>
      )}
    </Modal>
  );
}