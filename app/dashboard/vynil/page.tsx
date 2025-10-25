// File: app/dashboard/vinyl/page.tsx
"use client";

import { Button, Stack, Alert, Group, Text } from "@mantine/core";
import { PageHeader } from "../components/PageHeader"; // Adjust path if needed
import { Plus, Disc, AlertTriangle } from "lucide-react"; // Disc icon for vinyl
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { VinylRecord } from "@prisma/client"; // Import VinylRecord type
import { CreateEditVinylRecordModal } from "./components/CreateEditVinylRecordModal"; // Adjust path if needed
import { VinylRecordTable } from "./components/VinylRecordTable"; // Adjust path if needed
import { notifications } from "@mantine/notifications";
import { modals } from '@mantine/modals'; // Import modals manager

// Main Client Component
function VinylRecordsClientPage() {
    const [vinylRecords, setVinylRecords] = useState<VinylRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [recordToEdit, setRecordToEdit] = useState<VinylRecord | null>(null);
    // No 'showInactive' toggle needed as we're doing hard deletes for MVP

    // --- Data Fetching ---
    const fetchVinylRecords = async () => {
        setLoading(true);
        try {
            const url = `/api/vinyl-records`; // Fetch all records
            const response = await fetch(url);
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
            }
            const result: ApiResponse<VinylRecord[]> = await response.json();
            if (result.success && result.data) {
                setVinylRecords(result.data);
            } else {
                throw new Error(result.error || "Não foi possível carregar os discos");
            }
        } catch (error: any) {
            console.error("Fetch vinyl records error:", error);
            notifications.show({ title: "Erro ao buscar discos", message: error.message, color: "red" });
            setVinylRecords([]); // Clear on error
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchVinylRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Modal Handlers ---
    const handleOpenCreateModal = () => {
        setRecordToEdit(null);
        openModal();
    };

    const handleOpenEditModal = (record: VinylRecord) => {
        setRecordToEdit(record);
        openModal();
    };

    // --- Action Handlers (Delete) ---
    const openDeleteModal = (record: VinylRecord) => modals.openConfirmModal({
        title: `Excluir Disco "${record.title}"?`,
        centered: true,
        children: (
            <Text size="sm">
                Tem certeza que deseja excluir permanentemente o disco "{record.title}" por "{record.artist}"? Esta ação não pode ser desfeita.
            </Text>
        ),
        labels: { confirm: 'Excluir Disco', cancel: 'Cancelar' },
        confirmProps: { color: 'red' },
        onConfirm: () => handleDelete(record.id, record.title), // Pass ID and title
    });

    const handleDelete = async (id: number, title: string) => {
        setLoading(true); // Indicate loading state during delete
        try {
            const response = await fetch(`/api/vinyl-records/${id}`, { method: 'DELETE' });
            const result: ApiResponse = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falha ao excluir disco');

            notifications.show({
                title: 'Disco Excluído',
                message: `O disco "${title}" foi excluído com sucesso.`,
                color: 'green',
            });
            await fetchVinylRecords(); // Refresh the list
        } catch (error: any) {
            notifications.show({ title: 'Erro ao excluir', message: error.message, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---
    return (
        <>
            <CreateEditVinylRecordModal
                opened={modalOpened}
                onClose={closeModal}
                onSuccess={() => {
                    closeModal();
                    fetchVinylRecords(); // Refresh table
                }}
                recordToEdit={recordToEdit}
            />
            <Stack>
                <PageHeader
                    title="Gerenciar Discos de Vinil"
                    actionButton={
                         <Button
                            leftSection={<Plus size={16} />}
                            onClick={handleOpenCreateModal}
                            color="pastelGreen"
                         >
                            Adicionar Disco
                        </Button>
                    }
                />
                {/* Optional: Add an Alert for context if needed */}
                <VinylRecordTable
                    vinylRecords={vinylRecords}
                    loading={loading}
                    onEdit={handleOpenEditModal}
                    onDelete={openDeleteModal} // Use the confirmation modal trigger
                />
            </Stack>
        </>
    );
}

// Wrap client component - ModalsProvider should be in layout.tsx already
export default function VinylRecordsPage() {
    return <VinylRecordsClientPage />;
}