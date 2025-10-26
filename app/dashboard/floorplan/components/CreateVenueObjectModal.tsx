// PATH: app/dashboard/floorplan/components/CreateVenueObjectModal.tsx
// NOTE: This is a NEW FILE.

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

const objectTypeData = [
  { value: VenueObjectType.TABLE, label: "Mesa" },
  { value: VenueObjectType.BAR_SEAT, label: "Lugar no Bar" },
  { value: VenueObjectType.WORKSTATION, label: "Estação (PDV)" },
  { value: VenueObjectType.ENTERTAINMENT, label: "Entretenimento" },
  { value: VenueObjectType.IMPASSABLE, label: "Obstrução" },
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
      type: VenueObjectType.TABLE,
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
          reservationCost: values.reservationCost.toString(),
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

  return (
    <Modal opened={opened} onClose={handleClose} title="Novo Objeto">
      <LoadingOverlay visible={isSubmitting} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            required
            label="Nome / Identificador"
            placeholder="Ex: Mesa 12, Bar 01"
            {...form.getInputProps("name")}
          />
          <Select
            required
            label="Tipo de Objeto"
            data={objectTypeData}
            {...form.getInputProps("type")}
          />

          {/* Show Workstation select ONLY if type is WORKSTATION */}
          {formValues.type === VenueObjectType.WORKSTATION && (
            <Select
              required
              label="Estação de Trabalho"
              placeholder="Selecione a estação"
              data={workstationSelectData}
              {...form.getInputProps("workstationId")}
              searchable
            />
          )}

          {/* Show capacity ONLY for tables/seats */}
          {(formValues.type === VenueObjectType.TABLE ||
            formValues.type === VenueObjectType.BAR_SEAT) && (
            <NumberInput
              label="Capacidade (lugares)"
              min={1}
              {...form.getInputProps("capacity")}
            />
          )}
          
          {/* Show reservable toggle ONLY for tables */}
           {formValues.type === VenueObjectType.TABLE && (
            <Switch
              label="Pode ser reservado?"
              {...form.getInputProps('isReservable', { type: 'checkbox' })}
            />
           )}
           
           {/* Show reservation cost ONLY if reservable */}
           {formValues.type === VenueObjectType.TABLE && formValues.isReservable && (
             <NumberInput
                label="Custo da Reserva (R$)"
                decimalScale={2}
                fixedDecimalScale
                min={0}
                {...form.getInputProps('reservationCost')}
             />
           )}

          <Button type="submit" mt="md">
            Salvar
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}