"use client";

import {
  Paper,
  Title,
  Text,
  Stack,
  JsonInput,
  Button,
  LoadingOverlay,
} from "@mantine/core";
// Removed the incorrect import from "../page"
// Import the type directly from lib/types
import { ClientWithDetails } from "@/lib/types"; // Corrected import path
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { ApiResponse } from "@/lib/types";
import { Client } from "@prisma/client";

type ClientDetailProps = {
  // Use the imported ClientWithDetails type
  client: ClientWithDetails;
};

export function ClientDetail({ client }: ClientDetailProps) {
  const [crmData, setCrmData] = useState(
    JSON.stringify(client.crmData, null, 2)
  );
  const [loading, setLoading] = useState(false);

  const handleUpdateCrm = async () => {
    setLoading(true);
    try {
      // Ensure crmData is valid JSON before parsing and sending
      let parsedCrmData;
      try {
        parsedCrmData = JSON.parse(crmData);
      } catch (e) {
        throw new Error("Invalid JSON");
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crmData: parsedCrmData }), // Send parsed data
      });
      const result: ApiResponse<Client> = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao atualizar");

      notifications.show({
        title: "Sucesso!",
        message: "Perfil do cliente atualizado.",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Erro",
        message:
          error.message === "Invalid JSON"
            ? "O formato do JSON é inválido."
            : error.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper withBorder p="md" radius="md">
      <Stack>
        <Title order={4}>Perfil do Cliente (CRM)</Title>
        <LoadingOverlay visible={loading} />
        <JsonInput
          label="Social Profile, Hobbies, Preferências"
          description="Edite os dados do cliente aqui."
          formatOnBlur
          autosize
          minRows={20}
          value={crmData}
          onChange={setCrmData}
          validationError={!crmData || (() => { try { JSON.parse(crmData); return null; } catch { return 'JSON inválido'; } })()} // Added validation display
        />
        <Button onClick={handleUpdateCrm} color="privacyGold" loading={loading}>
          Salvar Perfil
        </Button>
      </Stack>
    </Paper>
  );
}