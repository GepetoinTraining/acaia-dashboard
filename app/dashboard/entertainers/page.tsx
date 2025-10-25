// File: app/dashboard/entertainers/page.tsx
"use client";

import { Button, Stack, Alert, Group, Text } from "@mantine/core";
import { PageHeader } from "../components/PageHeader"; // Adjust path if needed
import { Plus, Music, AlertTriangle } from "lucide-react"; // Music icon for entertainers
import { useDisclosure, useToggle } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { Entertainer } from "@prisma/client"; // Import Entertainer type
import { CreateEditEntertainerModal } from "./components/CreateEditEntertainerModal"; // Adjust path if needed
import { EntertainerTable } from "./components/EntertainerTable"; // Adjust path if needed
import { notifications } from "@mantine/notifications";
import { modals } from '@mantine/modals'; // Import modals manager

// Main Client Component
function EntertainersClientPage() {
    const [entertainers, setEntertainers] = useState<Entertainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [entertainerToEdit, setEntertainerToEdit] = useState<Entertainer | null>(null);
    const [showInactive, toggleShowInactive] = useToggle([false, true]); // State for filter

    // --- Data Fetching ---
    const fetchEntertainers = async () => {
        setLoading(true);
        try {
            const url = `/api/entertainers${showInactive ? '?includeInactive=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorResult = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
            }
            const result: ApiResponse<Entertainer[]> = await response.json();
            if (result.success && result.data) {
                setEntertainers(result.data);
            } else {
                throw new Error(result.error || "Não foi possível carregar os artistas");
            }
        } catch (error: any) {
            console.error("Fetch entertainers error:", error);
            notifications.show({ title: "Erro ao buscar artistas", message: error.message, color: "red" });
            setEntertainers([]); // Clear on error
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when filter changes
    useEffect(() => {
        fetchEntertainers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showInactive]);

    // --- Modal Handlers ---
    const handleOpenCreateModal = () => {
        setEntertainerToEdit(null);
        openModal();
    };

    const handleOpenEditModal = (entertainer: Entertainer) => {
        setEntertainerToEdit(entertainer);
        openModal();
    };

    // --- Action Handlers (Toggle Active, Delete/Deactivate) ---
    const handleToggleActive = async (entertainer: Entertainer, isActive: boolean) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/entertainers/${entertainer.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive }),
            });
            const result: ApiResponse = await response.json();
            if (!response.ok) throw new Error(result.error || `Falha ao ${isActive ? 'ativar' : 'desativar'} artista`);

            notifications.show({
                title: 'Sucesso!',
                message: `Artista "${entertainer.name}" ${isActive ? 'ativado' : 'desativado'}.`,
                color: 'green',
            });
            await fetchEntertainers(); // Refresh list
        } catch (error: any) {
             notifications.show({ title: 'Erro', message: error.message, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (entertainer: Entertainer) => modals.openConfirmModal({
        title: `Desativar Artista "${entertainer.name}"?`,
        centered: true,
        children: (
            <Text size="sm">
                Tem certeza que deseja desativar este artista? Ele não poderá ser selecionado para futuros eventos (funcionalidade futura).
                Ele pode ser reativado depois.
            </Text>
        ),
        labels: { confirm: 'Desativar Artista', cancel: 'Cancelar' },
        confirmProps: { color: 'red' },
        onConfirm: () => handleDelete(entertainer.id, entertainer.name),
    });

    const handleDelete = async (id: number, name: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/entertainers/${id}`, { method: 'DELETE' }); // DELETE triggers soft delete in API
            const result: ApiResponse = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falha ao desativar artista');

            notifications.show({
                title: 'Artista Desativado',
                message: `O artista "${name}" foi marcado como inativo.`,
                color: 'green',
            });
            await fetchEntertainers(); // Refresh
        } catch (error: any) {
            notifications.show({ title: 'Erro ao desativar', message: error.message, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---
    return (
        <>
            <CreateEditEntertainerModal
                opened={modalOpened}
                onClose={closeModal}
                onSuccess={() => {
                    closeModal();
                    fetchEntertainers(); // Refresh table
                }}
                entertainerToEdit={entertainerToEdit}
            />
            <Stack>
                <PageHeader
                    title="Gerenciar Artistas"
                    actionButton={
                        <Group>
                            <Button
                                variant={showInactive ? "light" : "outline"}
                                color={showInactive ? "yellow" : "gray"}
                                onClick={() => toggleShowInactive()}
                                leftSection={<AlertTriangle size={16} />}
                            >
                                {showInactive ? "Ocultar Inativos" : "Mostrar Inativos"}
                            </Button>
                            <Button
                                leftSection={<Plus size={16} />}
                                onClick={handleOpenCreateModal}
                                color="pastelGreen"
                            >
                                Adicionar Artista
                            </Button>
                        </Group>
                    }
                />
                {/* Optional: Add an Alert for context if needed */}
                <EntertainerTable
                    entertainers={entertainers}
                    loading={loading}
                    onEdit={handleOpenEditModal}
                    onDelete={openDeleteModal} // Use the confirmation modal trigger
                    onToggleActive={handleToggleActive}
                />
            </Stack>
        </>
    );
}

// Wrap client component - ModalsProvider should be in layout.tsx already
export default function EntertainersPage() {
    return <EntertainersClientPage />;
}