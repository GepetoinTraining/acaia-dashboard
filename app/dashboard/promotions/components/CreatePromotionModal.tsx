"use client";

import { Modal, TextInput, Select, NumberInput, Button, Group, Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Product } from "@/lib/types"; // Use client-side Product
import { DiscountType, Promotion } from "@prisma/client"; // This import will fail until you run 'npx prisma generate'
import { ApiResponse } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { PromotionWithProduct } from "../page";

type CreatePromotionModalProps = {
    opened: boolean;
    onClose: () => void;
    products: Product[]; // Use client-side Product
    onPromotionCreated: (promotion: PromotionWithProduct) => void;
};

// --- FIX: Add 'export' to the function ---
export function CreatePromotionModal({ opened, onClose, products, onPromotionCreated }: CreatePromotionModalProps) {
    const [loading, setLoading] = useState(false);
    const form = useForm({
        initialValues: {
            name: "",
            productId: null as string | null,
            discountType: DiscountType.PERCENTAGE,
            discountValue: 0,
            startDate: new Date(),
            endDate: null as Date | null,
        },
        // Add validation as needed
    });

    const productOptions = products.map(p => ({
        value: p.id.toString(),
        label: p.name,
    }));

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        if (!values.productId || !values.startDate) {
             notifications.show({ title: "Erro", message: "Campos obrigatórios em falta.", color: "red" });
             setLoading(false);
             return;
        }

        try {
            // This type 'Promotion' will cause an error until prisma generate is run
            const payload: Omit<Promotion, 'id' | 'createdAt'> = {
                ...values,
                productId: Number(values.productId),
                discountValue: Number(values.discountValue),
                startDate: values.startDate,
                endDate: values.endDate || null,
                isActive: true, // Set default
            };

            const response = await fetch("/api/promotions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse<PromotionWithProduct> = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || "Falha ao criar promoção");
            }

            notifications.show({
                title: "Sucesso",
                message: "Promoção criada com sucesso!",
                color: "green",
            });
            onPromotionCreated(result.data!); // Notify parent
            form.reset();
            onClose();

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
        <Modal opened={opened} onClose={onClose} title="Criar Nova Promoção" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    <TextInput
                        label="Nome da Promoção"
                        placeholder="Ex: Happy Hour Cerveja"
                        required
                        {...form.getInputProps("name")}
                    />
                    <Select
                        label="Produto"
                        placeholder="Selecione um produto"
                        data={productOptions}
                        searchable
                        required
                        {...form.getInputProps("productId")}
                    />
                    <Group grow>
                        <Select
                            label="Tipo de Desconto"
                            data={[
                                { value: DiscountType.PERCENTAGE, label: "Percentagem (%)" },
                                { value: DiscountType.FIXED, label: "Valor Fixo (R$)" },
                            ]}
                            required
                            {...form.getInputProps("discountType")}
                        />
                        <NumberInput
                            label="Valor do Desconto"
                            placeholder={form.values.discountType === DiscountType.PERCENTAGE ? "Ex: 15" : "Ex: 5.50"}
                            min={0}
                            decimalScale={2}
                            required
                            {...form.getInputProps("discountValue")}
                        />
                    </Group>
                    <Group grow>
                        <DateInput
                            label="Data de Início"
                            valueFormat="DD/MM/YYYY"
                            required
                            {...form.getInputProps("startDate")}
                        />
                        <DateInput
                            label="Data de Fim (Opcional)"
                            valueFormat="DD/MM/YYYY"
                            clearable
                            minDate={form.values.startDate || new Date()}
                            {...form.getInputProps("endDate")}
                        />
                    </Group>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose} disabled={loading}>Cancelar</Button>
                        <Button type="submit" loading={loading}>Criar Promoção</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}