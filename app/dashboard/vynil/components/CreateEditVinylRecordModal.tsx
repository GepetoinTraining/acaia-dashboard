// File: app/dashboard/vinyl/components/CreateEditVinylRecordModal.tsx
"use client";

import {
    Modal,
    TextInput,
    Button,
    Stack,
    LoadingOverlay,
    NumberInput // Added for Year input
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { VinylRecord, Prisma } from "@prisma/client"; // Import types
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types"; // Adjust path if needed
import { notifications } from "@mantine/notifications";
import { User, Disc, ListMusic, Calendar } from 'lucide-react'; // Icons

type CreateEditVinylRecordModalProps = {
    opened: boolean;
    onClose: () => void;
    onSuccess: () => void;
    recordToEdit?: VinylRecord | null;
};

export function CreateEditVinylRecordModal({
    opened,
    onClose,
    onSuccess,
    recordToEdit,
}: CreateEditVinylRecordModalProps) {
    const [loading, setLoading] = useState(false);
    const isEditMode = Boolean(recordToEdit);

    const form = useForm({
        initialValues: {
            artist: "",
            title: "",
            genre: "",
            year: '' as number | '', // Allow empty string for NumberInput reset
        },
        validate: {
            artist: (val) => (val.trim().length < 1 ? "Artista é obrigatório" : null),
            title: (val) => (val.trim().length < 1 ? "Título é obrigatório" : null),
            year: (val) => {
                if (val === null || val === '') return null; // Allow empty/null
                const num = Number(val);
                return (isNaN(num) || num < 1000 || num > new Date().getFullYear() + 1)
                       ? "Ano inválido (ex: 1995)"
                       : null;
            },
        },
    });

    // Populate form if editing
    useEffect(() => {
        if (recordToEdit && opened) {
            form.setValues({
                artist: recordToEdit.artist,
                title: recordToEdit.title,
                genre: recordToEdit.genre || "",
                year: recordToEdit.year ?? '', // Use empty string if year is null
            });
        } else if (!opened) {
            form.reset(); // Reset form when modal closes or opens for creation
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recordToEdit, opened]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
             const payload = {
                 ...values,
                 genre: values.genre || null, // Ensure null is sent if empty
                 year: values.year === '' || values.year === null ? null : Number(values.year), // Convert year back to number or null
             };

            const url = isEditMode ? `/api/vinyl-records/${recordToEdit?.id}` : "/api/vinyl-records";
            const method = isEditMode ? "PATCH" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse<VinylRecord> = await response.json();
            if (!response.ok) {
                throw new Error(result.error || `Falha ao ${isEditMode ? 'atualizar' : 'adicionar'} disco`);
            }

            notifications.show({
                title: "Sucesso!",
                message: `Disco "${values.title}" ${isEditMode ? 'atualizado' : 'adicionado'} com sucesso.`,
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
            title={isEditMode ? "Editar Disco de Vinil" : "Adicionar Novo Disco"}
            centered
        >
            <LoadingOverlay visible={loading} />
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        required
                        label="Artista"
                        placeholder="Nome do artista ou banda"
                        leftSection={<User size={16} />}
                        {...form.getInputProps("artist")}
                    />
                    <TextInput
                        required
                        label="Título do Álbum/Disco"
                        placeholder="Nome do disco"
                        leftSection={<Disc size={16} />}
                        {...form.getInputProps("title")}
                    />
                    <TextInput
                        label="Gênero Musical"
                        placeholder="Ex: Rock, MPB, Eletrônica"
                        leftSection={<ListMusic size={16} />}
                        {...form.getInputProps("genre")}
                    />
                     <NumberInput
                        label="Ano de Lançamento"
                        placeholder="Ex: 1995 (opcional)"
                        leftSection={<Calendar size={16} />}
                        min={1000} // Optional: Set a sensible minimum year
                        max={new Date().getFullYear() + 1} // Optional: Set max year
                        step={1}
                        allowDecimal={false}
                        allowNegative={false}
                        {...form.getInputProps("year")}
                     />

                    <Button type="submit" mt="md" color="pastelGreen" loading={loading}>
                        {isEditMode ? "Salvar Alterações" : "Adicionar Disco"}
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}