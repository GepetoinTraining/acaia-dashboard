"use client";

import { Button, Stack } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { Plus, Building } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";
import { Partner } from "@prisma/client";
import { CreatePartnerModal } from "./components/CreatePartnerModal";
import { PartnerTable } from "./components/PartnerTable";

function PartnersClientPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/partners");
      if (!response.ok) throw new Error("Failed to fetch partners");
      const result: ApiResponse<Partner[]> = await response.json();
      if (result.success && result.data) {
        setPartners(result.data);
      }
    } catch (error) {
      console.error(error);
      // TODO: Show notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return (
    <>
      <CreatePartnerModal
        opened={opened}
        onClose={close}
        onSuccess={() => {
          close();
          fetchPartners(); // Refresh the table
        }}
      />
      <Stack>
        <PageHeader
          title="Parceiros (Consignação)"
          actionButton={
            <Button
              leftSection={<Plus size={16} />}
              onClick={open}
              color="privacyGold"
            >
              Adicionar Parceiro
            </Button>
          }
        />
        <PartnerTable partners={partners} loading={loading} />
      </Stack>
    </>
  );
}

export default function PartnersPage() {
  return <PartnersClientPage />;
}

