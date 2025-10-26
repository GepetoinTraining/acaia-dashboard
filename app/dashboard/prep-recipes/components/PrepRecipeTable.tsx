
"use client";

import {
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Text,
  Loader,
  Group,
  Stack,
  Button // Added Button
} from "@mantine/core";
import { IconPencil, IconTrash, IconInputAi, IconOutlet, IconPlayerPlay } from "@tabler/icons-react"; // Added IconPlayerPlay
import { SerializedPrepRecipe, ApiResponse } from "@/lib/types";
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react'; // Added useState
import { ExecutePrepTaskModal } from './ExecutePrepTaskModal'; // Import the new modal
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { VenueObject } from '@prisma/client'; // Import VenueObject

// Type for VenueObject used as location
type StockLocation = Pick<VenueObject, 'id' | 'name'>;


interface PrepRecipeTableProps {
  data: SerializedPrepRecipe[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (prepRecipe: SerializedPrepRecipe) => void;
}

export function PrepRecipeTable({
  data,
  isLoading,
  onRefresh,
  onEdit,
}: PrepRecipeTableProps) {
  const queryClient = useQueryClient();
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [recipeToExecute, setRecipeToExecute] = useState<SerializedPrepRecipe | null>(null);

  // Fetch Stock Locations for the modal
  const { data: locations, isLoading: isLoadingLocations } = useQuery<StockLocation[]>({
      queryKey: ['stockLocations'],
      queryFn: async () => {
          const res = await fetch("/api/venue-objects"); // Needs filtering or dedicated endpoint
          const result: ApiResponse<VenueObject[]> = await res.json();
          if (result.success && result.data) {
              const storageTypes: VenueObject['type'][] = ['STORAGE', 'FREEZER', 'SHELF', 'WORKSTATION_STORAGE'];
              return result.data
                  .filter(vo => storageTypes.includes(vo.type))
                  .map(vo => ({ id: vo.id, name: vo.name }));
          }
          throw new Error(result.error || "Falha ao buscar locais de estoque");
      },
      staleTime: 5 * 60 * 1000, // Cache locations for 5 mins
  });


  const deletePrepRecipe = useMutation({ /* ... (mutation code remains the same) ... */ });
  const handleDeleteClick = (recipe: SerializedPrepRecipe) => { /* ... (handler code remains the same) ... */ };

  const handleOpenExecuteModal = (recipe: SerializedPrepRecipe) => {
      setRecipeToExecute(recipe);
      setIsExecuteModalOpen(true);
  }

   const handleCloseExecuteModal = () => {
      setRecipeToExecute(null);
      setIsExecuteModalOpen(false);
   }

   const handleExecuteSuccess = () => {
       handleCloseExecuteModal();
       // Invalidate stock-related queries after successful execution
       queryClient.invalidateQueries({ queryKey: ['stockHoldings'] });
       queryClient.invalidateQueries({ queryKey: ['aggregatedStock'] });
       onRefresh(); // Refresh prep recipes list if needed
   }


  const rows = data.map((recipe) => {
    return (
      <Table.Tr key={recipe.id}>
        {/* ... (other Table.Td cells remain the same) ... */}
         <Table.Td>
             <Text fw={500}>{recipe.name}</Text>
             <Text size="xs" c="dimmed">{recipe.notes || ''}</Text>
        </Table.Td>
        <Table.Td>
            <Stack gap={2}>
                 {recipe.inputs.map(input => (
                    <Group key={input.id} gap={4} wrap="nowrap">
                         <IconInputAi size={14} opacity={0.7}/>
                         <Text size="xs">
                             {parseFloat(input.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {input.ingredient.unit}
                         </Text>
                          <Text size="xs" c="dimmed">({input.ingredient.name})</Text>
                    </Group>
                 ))}
             </Stack>
        </Table.Td>
        <Table.Td>
             <Group gap={4} wrap="nowrap">
                <IconOutlet size={14} opacity={0.7}/>
                 <Text size="sm" fw={500}>
                      {parseFloat(recipe.outputQuantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {recipe.outputIngredient.unit}
                 </Text>
                 <Text size="sm">({recipe.outputIngredient.name})</Text>
             </Group>
        </Table.Td>
         <Table.Td>{recipe.estimatedLaborTime ? `${recipe.estimatedLaborTime} min` : 'N/A'}</Table.Td>

        <Table.Td>
          <Group gap="xs" wrap="nowrap">
            {/* --- ADDED EXECUTE BUTTON --- */}
            <Tooltip label="Executar Preparo">
                <ActionIcon
                    variant="light"
                    color="green"
                    onClick={() => handleOpenExecuteModal(recipe)}
                    disabled={isLoadingLocations || !locations || locations.length === 0} // Disable if locations not ready
                >
                    <IconPlayerPlay size={18} />
                </ActionIcon>
            </Tooltip>
            {/* --- END ADDITION --- */}
            <Tooltip label="Editar Receita">
              <ActionIcon variant="light" color="blue" onClick={() => onEdit(recipe)}>
                <IconPencil size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Excluir Receita">
              <ActionIcon variant="light" color="red" onClick={() => handleDeleteClick(recipe)} loading={deletePrepRecipe.isPending && deletePrepRecipe.variables === recipe.id}>
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (isLoading || isLoadingLocations) { // Check both loading states
    return <Loader />;
  }

  return (
    <>
      {/* --- ADDED MODAL INSTANCE --- */}
      <ExecutePrepTaskModal
          opened={isExecuteModalOpen}
          onClose={handleCloseExecuteModal}
          onSuccess={handleExecuteSuccess}
          prepRecipe={recipeToExecute}
          locations={locations ?? []} // Pass fetched locations
      />
       {/* --- END ADDITION --- */}

      <Table.ScrollContainer minWidth={800}>
        {/* ... (Table structure remains the same) ... */}
         <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
            <Table.Tr>
                <Table.Th>Nome / Notas</Table.Th>
                <Table.Th>Ingredientes Entrada</Table.Th>
                <Table.Th>Ingrediente Saída (Rendimento)</Table.Th>
                <Table.Th>Tempo Estimado</Table.Th>
                <Table.Th>Ações</Table.Th>
            </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
            {rows.length > 0 ? (
                rows
            ) : (
                <Table.Tr>
                <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" my="md">Nenhuma receita de preparo definida.</Text>
                </Table.Td>
                </Table.Tr>
            )}
            </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}