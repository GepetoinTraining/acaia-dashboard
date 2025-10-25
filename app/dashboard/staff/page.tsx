"use client";

import { prisma } from "@/lib/prisma";
import { Staff } from "@prisma/client";
import { Button, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { CreateStaffModal } from "./components/CreateStaffModal";
import { StaffTable } from "./components/StaffTable";
import { PageHeader } from "../components/PageHeader";
import { UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { ApiResponse } from "@/lib/types";

// This component fetches data on the client side for reactivity
function StaffClientPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");
      const result: ApiResponse<Staff[]> = await response.json();
      if (result.success && result.data) {
        setStaff(result.data);
      }
    } catch (error) {
      console.error(error);
      // TODO: Show notification
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <>
      <CreateStaffModal
        opened={opened}
        onClose={close}
        onSuccess={() => {
          close();
          fetchStaff(); // Refresh the table
        }}
      />
      <Stack>
        <PageHeader
          title="Equipe (Staff)"
          actionButton={
            <Button
              leftSection={<UserPlus size={16} />}
              onClick={open}
              color="privacyGold"
            >
              Adicionar Staff
            </Button>
          }
        />
        <StaffTable staff={staff} loading={loading} />
      </Stack>
    </>
  );
}

// We wrap the client component in a default export
export default function StaffPage() {
  return <StaffClientPage />;
}
