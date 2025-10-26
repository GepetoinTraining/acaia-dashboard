// PATH: app/dashboard/floorplan/components/CreateVenueObjectModal.tsx
"use client";

import { useState } from "react";
import {
  Modal,
  TextInput,
  Button,
  NumberInput,
  Stack,
  LoadingOverlay,
  Select,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { ApiResponse } from "@/lib/types";
import { VenueObject, VenueObjectType, Workstation } from "@prisma/client";

interface CreateVenueObjectModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  floorPlanId: string;
  workstations: Workstation[]; // Pass workstations for the 'WORKSTATION' type
}

// Updated objectTypeData to include STORAGE types
const objectTypeData = [
  { value: VenueObjectType.TABLE, label: "Mesa" },
  { value: VenueObjectType.BAR_SEAT, label: "Lugar no Bar" },
  { value: VenueObjectType.WORKSTATION, label: "Estação (PDV)" },
  { value: VenueObjectType.ENTERTAINMENT, label: "Entretenimento" },
  { value: VenueObjectType.IMPASSABLE, label: "Obstrução" },
  { value: VenueObjectType.STORAGE, label: "Armazenamento Geral" },
  { value: VenueObjectType.FREEZER, label: "Congelador/Freezer" },
  { value: VenueObjectType.SHELF, label: "Prateleira/Estante" },
  { value: VenueObjectType.WORKSTATION_STORAGE, label: "Armazenamento de Estação" },
];

export function CreateVenueObjectModal({
  opened,
  onClose,
  onSuccess,
  floorPlanId,
  workstations,
}: CreateVenueObjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: "",
      type: VenueObjectType.TABLE, // Default to TABLE
      workstationId: null as string | null,
      capacity: 2,
      isReservable: false,
      reservationCost: 0,
    },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : "Nome é obrigatório"),
      type: (value) => (value ? null : "Tipo é obrigatório"),
      workstationId: (value, values) =>
        values.type === VenueObjectType.WORKSTATION && !value
          ? "Estação é obrigatória para este tipo"
          : null,
      // Add validation for capacity/reservation only for relevant types if needed
    },
  });

  // Get workstation data for the Select
  const workstationSelectData = workstations.map((w) => ({
    value: w.id,
    label: w.name,
  }));

  // Get current form values
  const formValues = form.values;

  const handleSubmit = async (values: typeof form.values) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/venue-objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          floorPlanId: floorPlanId,
          // Only send capacity if relevant type
          capacity: [VenueObjectType.TABLE, VenueObjectType.BAR_SEAT].includes(values.type) ? values.capacity : null,
          // Only send reservable/cost if relevant type
          isReservable: values.type === VenueObjectType.TABLE ? values.isReservable : false,
          reservationCost: (values.type === VenueObjectType.TABLE && values.isReservable) ? values.reservationCost.toString() : null,
          // Ensure workstationId is null if type is not WORKSTATION
          workstationId:
            values.type === VenueObjectType.WORKSTATION
              ? values.workstationId
              : null,
        }),
      });

      const data: ApiResponse<VenueObject> = await response.json();

      if (response.ok && data.success) {
        notifications.show({
          title: "Sucesso",
          message: "Objeto criado com sucesso!",
          color: "green",
        });
        form.reset();
        onSuccess();
      } else {
        notifications.show({
          title: "Erro",
          message: data.error || "Falha ao criar objeto",
          color: "red",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      notifications.show({
        title: "Erro",
        message: "Ocorreu um erro inesperado",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Determine if the current type is a storage type
  const isStorageType = [
    VenueObjectType.STORAGE,
    VenueObjectType.FREEZER,
    VenueObjectType.SHELF,
    VenueObjectType.WORKSTATION_STORAGE
  ].includes(formValues.type);

  return (
    <Modal opened={opened} onClose={handleClose} title="Novo Objeto na Planta">
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome / Identificador"
            placeholder="Ex: Mesa 12, Bar 01, Freezer Cozinha"
            {...form.getInputProps("name")}
          />
          <Select
            required
            label="Tipo de Objeto"
            data={objectTypeData}
            {...form.getInputProps("type")}
          />

          {/* Conditional Fields based on Type */}

          {/* --- WORKSTATION Specific --- */}
          {formValues.type === VenueObjectType.WORKSTATION && (
            <Select
              required
              label="Estação de Trabalho Vinculada"
              description="Qual estação este objeto representa?"
              placeholder="Selecione a estação"
              data={workstationSelectData}
              {...form.getInputProps("workstationId")}
              searchable
            />
          )}

          {/* --- TABLE/SEAT Specific --- */}
          {(formValues.type === VenueObjectType.TABLE ||
            formValues.type === VenueObjectType.BAR_SEAT) && (
            <NumberInput
              label="Capacidade (lugares)"
              min={1}
              {...form.getInputProps("capacity")}
            />
          )}

          {/* --- TABLE Specific --- */}
           {formValues.type === VenueObjectType.TABLE && (
            <>
                <Switch
                  label="Pode ser reservado?"
                  {...form.getInputProps('isReservable', { type: 'checkbox' })}
                  mt="sm"
                />
                {formValues.isReservable && (
                 <NumberInput
                    label="Custo da Reserva (R$)"
                    decimalScale={2}
                    fixedDecimalScale
                    min={0}
                    {...form.getInputProps('reservationCost')}
                    mt="xs"
                 />
               )}
            </>
           )}

            {/* --- STORAGE Specific (No specific fields needed for now) --- */}
            {/* {isStorageType && (
                <Text size="sm" c="dimmed" mt="sm">Este objeto será usado como local de estoque.</Text>
            )} */}


          {/* --- IMPASSABLE/ENTERTAINMENT (No specific fields needed) --- */}

          <Button type="submit" mt="xl">
            Salvar Objeto
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}