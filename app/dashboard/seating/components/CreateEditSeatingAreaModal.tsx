// File: app/dashboard/seating/components/CreateEditSeatingAreaModal.tsx
"use client";

import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  LoadingOverlay,
  NumberInput,
  Switch
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { SeatingArea, SeatingAreaType, Prisma } from "@prisma/client"; // Import types
import { useState, useEffect } from "react";
import { ApiResponse, SeatingAreaWithVisitInfo } from "@/lib/types"; // Adjust path if needed
import { notifications } from "@mantine/notifications";
import { Armchair, Hash, Tag, CircleDollarSign } from 'lucide-react'; // Icons

type CreateEditSeatingAreaModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  areaToEdit?: SeatingAreaWithVisitInfo | SeatingArea | null; // Accept either type from GET or POST/PATCH
};

// Convert Prisma Decimal to number/string for form input
function formatDecimalForInput(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    // Check if it's a Decimal object before calling toNumber()
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
        return value.toNumber();
    }
    // Check if it's a string representation of a number
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }
    // Assume it's already a number
    if (typeof value === 'number') {
        return value;
    }
    return 0; // Fallback
}


export function CreateEditSeatingAreaModal({
  opened,
  onClose,
  onSuccess,
  areaToEdit,
}: CreateEditSeatingAreaModalProps) {
  const [loading, setLoading] = useState(false);
  const isEditMode = Boolean(areaToEdit);

  const form = useForm({
    initialValues: {
      name: "",
      capacity: null as number | null | '', // Allow empty string for NumberInput reset
      type: SeatingAreaType.TABLE,
      reservationCost: 0,
      isActive: true,
    },
    validate: {
      name: (val) => (val.trim().length < 1 ? "Nome é obrigatório" : null),
       capacity: (val) => {
           if (val === null || val === '') return null; // Allow empty/null
           const num = Number(val);
           return isNaN(num) || num < 0 ? "Capacidade deve ser um número positivo ou vazio" : null;
       },
       reservationCost: (val) => {
           if (val === null || val === '') return null; // Allow empty cost which defaults to 0
           const num = Number(val);
           return isNaN(num) || num < 0 ? "Custo deve ser um número positivo ou zero" : null;
       },
      type: (val) => (!Object.values(SeatingAreaType).includes(val) ? "Tipo inválido" : null),
    },
  });

  // Populate form if editing
  useEffect(() => {
    if (areaToEdit && opened) {
      form.setValues({
        name: areaToEdit.name,
        capacity: areaToEdit.capacity ?? '', // Use empty string for NumberInput reset if null
        type: areaToEdit.type,
        reservationCost: formatDecimalForInput(areaToEdit.reservationCost),
        isActive: areaToEdit.isActive,
      });
    } else if (!opened) {
      form.reset(); // Reset form when modal closes or opens for creation
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaToEdit, opened]); // Rerun effect when areaToEdit or opened changes

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Prepare payload, ensuring capacity is number or null, cost is number
       const payload = {
            ...values,
            // Convert empty string/null capacity back to null for DB, otherwise parse as number
            capacity: values.capacity === '' || values.capacity === null ? null : parseInt(String(values.capacity)),
            // Convert cost, default to 0 if empty/null
            reservationCost: values.reservationCost === '' || values.reservationCost === null ? 0 : parseFloat(String(values.reservationCost)),
       };

      const url = isEditMode ? `/api/seating-areas/${areaToEdit?.id}` : "/api/seating-areas";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<SeatingArea> = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} área`);
      }

      notifications.show({
        title: "Sucesso!",
        message: `Área "${values.name}" ${isEditMode ? 'atualizada' : 'criada'} com sucesso.`,
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
      title={isEditMode ? "Editar Área de Assento" : "Adicionar Nova Área"}
      centered
    >
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome da Área"
            placeholder="Ex: Mesa 5, Bar 2, Lounge VIP"
            leftSection={<Tag size={16} />}
            {...form.getInputProps("name")}
          />
          <Select
            required
            label="Tipo"
            leftSection={<Armchair size={16} />}
            data={Object.values(SeatingAreaType).map((type) => ({
              // Make labels more readable (e.g., BAR_SEAT -> Bar Seat)
              label: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
              value: type,
            }))}
            {...form.getInputProps("type")}
          />
           <NumberInput
             label="Capacidade"
             placeholder="Número de lugares (opcional)"
             leftSection={<Hash size={16} />}
             min={0}
             step={1}
             allowDecimal={false}
             allowNegative={false}
             // Mantine NumberInput handles string conversion, empty string becomes null/undefined on submit if configured correctly
             {...form.getInputProps("capacity")}
           />
           <NumberInput
             label="Custo de Reserva (R$)"
             description="Valor para reservar esta área (0 se não aplicável)"
             leftSection={<CircleDollarSign size={16} />}
             min={0}
             step={1.00} // Or other steps like 0.50
             decimalScale={2}
             fixedDecimalScale
             allowNegative={false}
             {...form.getInputProps("reservationCost")}
           />
           {isEditMode && (
              <Switch
                mt="md"
                label="Área está ativa?"
                description="Áreas inativas não aparecem para seleção ou reserva."
                {...form.getInputProps('isActive', { type: 'checkbox' })}
              />
           )}

          <Button type="submit" mt="md" color="pastelGreen" loading={loading}>
            {isEditMode ? "Salvar Alterações" : "Criar Área"}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}