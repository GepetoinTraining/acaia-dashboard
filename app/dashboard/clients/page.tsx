"use client";

import { Button, Stack } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Plus, User } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { Client } from "@prisma/client";
import { CreateClientModal } from "./components/CreateClientModal";
import { ClientTable } from "./components/ClientTable";

function ClientsClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const result: ApiResponse<Client[]> = await response.json();
      if (result.success && result.data) {
        setClients(result.data);
      }
    } catch (error) {
      console.error(error);
      // TODO: Show notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <>
      <CreateClientModal
        opened={opened}
        onClose={close}
        onSuccess={() => {
          close();
          fetchClients(); // Refresh the table
        }}
      />
      <Stack>
        <PageHeader
          title="Clientes"
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={open}
              color="privacyGold"
            >
              Adicionar Cliente
            </Button>
          }
        />
        <ClientTable clients={clients} loading={loading} />
      </Stack>
    </>
  );
}

export default function ClientsPage() {
  return <ClientsClientPage />;
}

