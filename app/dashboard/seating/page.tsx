// File: app/dashboard/seating/page.tsx
"use client";

import { Button, Stack, Alert, Group, Text } from "@mantine/core"; // Added Group, Text
import { PageHeader } from "../components/PageHeader"; // Adjust path if needed
import { Plus, Armchair, AlertTriangle, QrCode } from "lucide-react"; // Added QrCode icon
import { useDisclosure, useToggle } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse, SeatingAreaWithVisitInfo } from "@/lib/types"; // Adjust path if needed
import { CreateEditSeatingAreaModal } from "./components/CreateEditSeatingAreaModal"; // Adjust path if needed
import { SeatingAreaTable } from "./components/SeatingAreaTable"; // Adjust path if needed
import { notifications } from "@mantine/notifications";
// Import Mantine ModalsProvider and modals manager
// You need to wrap your layout in <ModalsProvider> for this to work
import { ModalsProvider, modals } from '@mantine/modals';

function SeatingAreasClientPage() {
  const [areas, setAreas] = useState<SeatingAreaWithVisitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [areaToEdit, setAreaToEdit] = useState<SeatingAreaWithVisitInfo | null>(null);
  const [showInactive, toggleShowInactive] = useToggle([false, true]); // State for filter

  // Function to fetch seating areas
  const fetchAreas = async () => {
    setLoading(true);
    try {
      // Add query parameter to include inactive based on state
      const url = `/api/seating-areas${showInactive ? '?includeInactive=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
           const errorResult = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
           throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<SeatingAreaWithVisitInfo[]> = await response.json();
      if (result.success && result.data) {
        setAreas(result.data);
      } else {
        throw new Error(result.error || "Não foi possível carregar as áreas");
      }
    } catch (error: any) {
      console.error("Fetch areas error:", error);
      notifications.show({ title: "Erro ao buscar áreas", message: error.message, color: "red" });
      setAreas([]); // Clear areas on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch areas when component mounts or filter changes
  useEffect(() => {
    fetchAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]); // Refetch when showInactive changes

  // Open modal for creating a new area
  const handleOpenCreateModal = () => {
    setAreaToEdit(null); // Clear editing state
    openModal();
  };

  // Open modal for editing an existing area
  const handleOpenEditModal = (area: SeatingAreaWithVisitInfo) => {
    setAreaToEdit(area);
    openModal();
  };

   // Handle quick toggle of isActive status via Switch
   const handleToggleActive = async (area: SeatingAreaWithVisitInfo, isActive: boolean) => {
        // Optional: Optimistic UI update
        // setAreas(currentAreas => currentAreas.map(a => a.id === area.id ? {...a, isActive} : a));

        setLoading(true); // Indicate loading state during update
        try {
            const response = await fetch(`/api/seating-areas/${area.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }), // Send only the isActive flag
            });
            const result: ApiResponse = await response.json();
            if (!response.ok) throw new Error(result.error || `Falha ao ${isActive ? 'ativar' : 'desativar'} área`);

            notifications.show({
                title: 'Sucesso!',
                message: `Área "${area.name}" ${isActive ? 'ativada' : 'desativada'}.`,
                color: 'green',
            });
            await fetchAreas(); // Refresh list from server to get confirmed state
        } catch (error: any) {
             notifications.show({ title: 'Erro', message: error.message, color: 'red' });
             // Optional: Revert optimistic update if it failed
             // await fetchAreas();
        } finally {
            setLoading(false);
        }
    };

  // Opens the delete confirmation modal
  const openDeleteModal = (area: SeatingAreaWithVisitInfo) => modals.openConfirmModal({
        title: `Desativar Área "${area.name}"?`,
        centered: true,
        children: (
            <Text size="sm">
                Tem certeza que deseja desativar esta área? Ela não poderá ser selecionada para novos pedidos ou check-ins via QR code.
                Visitas ativas nesta área não serão afetadas. A área pode ser reativada depois.
            </Text>
        ),
        labels: { confirm: 'Desativar Área', cancel: 'Cancelar' },
        confirmProps: { color: 'red' },
        onConfirm: () => handleDelete(area.id, area.name), // Pass ID and name to handler
  });

   // Handles the actual delete (soft delete by setting isActive=false) after confirmation
   const handleDelete = async (id: number, name: string) => {
       setLoading(true); // Indicate loading state
       try {
           const response = await fetch(`/api/seating-areas/${id}`, {
               method: 'DELETE', // DELETE request triggers the inactivation logic in the API
           });
           const result: ApiResponse = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falha ao desativar área');

            notifications.show({
                title: 'Área Desativada',
                message: `A área "${name}" foi marcada como inativa.`,
                color: 'green',
            });
            await fetchAreas(); // Refresh the list
       } catch (error: any) {
            notifications.show({ title: 'Erro ao desativar', message: error.message, color: 'red' });
       } finally {
            setLoading(false);
       }
   };

  return (
    <>
      <CreateEditSeatingAreaModal
        opened={modalOpened}
        onClose={closeModal}
        onSuccess={() => {
          closeModal();
          fetchAreas(); // Refresh the table after create/edit success
        }}
        areaToEdit={areaToEdit}
      />
      <Stack>
        <PageHeader
          title="Gerenciar Mesas / Áreas"
          actionButton={
            <Group>
                {/* Button to toggle showing inactive areas */}
                <Button
                    variant={showInactive ? "light" : "outline"}
                    color={showInactive ? "yellow" : "gray"}
                    onClick={() => toggleShowInactive()}
                    leftSection={<AlertTriangle size={16} />}
                 >
                     {showInactive ? "Ocultar Inativas" : "Mostrar Inativas"}
                 </Button>
                 {/* Button to open the create modal */}
                <Button
                    leftSection={<Plus size={16} />}
                    onClick={handleOpenCreateModal}
                    color="pastelGreen" // Use theme color
                    >
                    Adicionar Área
                </Button>
            </Group>
          }
        />
        {/* Informational Alert about QR Codes */}
        <Alert variant="light" color="blue" title="QR Codes para Mesas" icon={<QrCode />} >
            Cada área ativa possui um Token QR único exibido na tabela. Use um gerador de QR Code
            (online ou app) para criar um QR Code apontando para a URL do seu site + `/menu/[TOKEN_DA_AREA]`.
            <Text ff="monospace" component="span" td="underline" ml={4}>Ex: https://seu-site.com/menu/a1b2c3d4e5f6</Text>.
            Cole o QR na mesa/área correspondente para os clientes escanearem.
        </Alert>
        {/* Seating Area Table */}
        <SeatingAreaTable
            areas={areas}
            loading={loading}
            onEdit={handleOpenEditModal} // Pass edit handler
            onDelete={openDeleteModal} // Pass delete confirmation trigger
            onToggleActive={handleToggleActive} // Pass toggle handler
         />
      </Stack>
    </>
  );
}

// Wrap the client component in the ModalsProvider
export default function SeatingAreasPage() {
  // IMPORTANT: Make sure <ModalsProvider> is also included higher up in your layout
  // (e.g., in app/dashboard/layout.tsx or app/layout.tsx) if it's not already there.
  // If it's already in a parent layout, you might not need it here.
  // For simplicity assuming it might be missing:
  return (
      <ModalsProvider>
          <SeatingAreasClientPage />
      </ModalsProvider>
  );
}