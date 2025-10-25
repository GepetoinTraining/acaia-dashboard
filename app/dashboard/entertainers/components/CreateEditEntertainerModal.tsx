// File: app/dashboard/entertainers/components/CreateEditEntertainerModal.tsx
"use client";

import {
    Modal,
    TextInput,
    Button,
    Stack,
    LoadingOverlay,
    Textarea,
    Switch
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Entertainer, Prisma } from "@prisma/client"; // Import types
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { notifications } from "@mantine/notifications";
import { User, Music, FileText } from 'lucide-react'; // Icons

type CreateEditEntertainerModalProps = {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
    entertainerToEdit?: Entertainer | null;
};

export function CreateEditEntertainerModal({
    opened,
    onClose,
    onSuccess,
    entertainerToEdit,
}: CreateEditEntertainerModalProps) {
    const [loading, setLoading] = useState(false);
    const isEditMode = Boolean(entertainerToEdit);

    const form = useForm({
        initialValues: {
            name: "",
            type: "", // e.g., "DJ", "Band", "Solo Musician"
            contactNotes: "",
            isActive: true,
        },
        validate: {
            name: (val) => (val.trim().length < 1 ? "Nome é obrigatório" : null),
            type: (val) => (val.trim().length < 1 ? "Tipo é obrigatório" : null),
        },
    });

    // Populate form if editing
    useEffect(() => {
        if (entertainerToEdit && opened) {
            form.setValues({
                name: entertainerToEdit.name,
                type: entertainerToEdit.type,
                contactNotes: entertainerToEdit.contactNotes || "",
                isActive: entertainerToEdit.isActive,
            });
        } else if (!opened) {
            form.reset(); // Reset form when modal closes or opens for creation
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entertainerToEdit, opened]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                contactNotes: values.contactNotes || null, // Ensure null is sent if empty
            };

            const url = isEditMode ? `/api/entertainers/${entertainerToEdit?.id}` : "/api/entertainers";
            const method = isEditMode ? "PATCH" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse<Entertainer> = await response.json();
            if (!response.ok) {
                throw new Error(result.error || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} artista`);
            }

            notifications.show({
                title: "Sucesso!",
                message: `Artista "${values.name}" ${isEditMode ? 'atualizado' : 'criado'} com sucesso.`,
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

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isEditMode ? "Editar Artista" : "Adicionar Novo Artista"}
            centered
        >
            <LoadingOverlay visible={loading} />
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        required
                        label="Nome do Artista / Banda"
                        placeholder="Ex: DJ Exemplo, Banda Tal"
                        leftSection={<User size={16} />}
                        {...form.getInputProps("name")}
                    />
                    <TextInput
                        required
                        label="Tipo"
                        placeholder="Ex: DJ, Banda, Músico Solo"
                        leftSection={<Music size={16} />}
                        {...form.getInputProps("type")}
                    />
                    <Textarea
                        label="Notas de Contato / Observações"
                        placeholder="Ex: Telefone, redes sociais, estilo musical, etc."
                        leftSection={<FileText size={16} />}
                        autosize
                        minRows={3}
                        {...form.getInputProps("contactNotes")}
                    />
                    {isEditMode && (
                        <Switch
                            mt="md"
                            label="Artista está ativo?"
                            description="Artistas inativos não aparecem para seleção."
                            {...form.getInputProps('isActive', { type: 'checkbox' })}
                        />
                    )}

                    <Button type="submit" mt="md" color="pastelGreen" loading={loading}>
                        {isEditMode ? "Salvar Alterações" : "Criar Artista"}
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}