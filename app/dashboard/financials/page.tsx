"use client";

import { Text, Stack, LoadingOverlay, Alert, Tabs } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";
// Import HostessPayoutSummary explicitly if needed for casting, or rely on FinancialsData
import { ApiResponse, FinancialsData, HostessPayoutSummary } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import { Building, CircleDollarSign, Heart, User } from "lucide-react";
import { StaffPayoutTable } from "./components/StaffPayoutTable";
import { PartnerPayoutTable } from "./components/PartnerPayoutTable";
import { HostessPayoutInfo } from "./components/HostessPayoutInfo";

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/financials");
      if (!response.ok) {
         // Try to parse error from response body
         let errorMsg = "Failed to fetch financial data";
         try {
             const errorResult: ApiResponse = await response.json();
             if (errorResult.error) {
                 errorMsg = errorResult.error;
             }
         } catch (parseError) {
             // Ignore if response is not JSON
         }
         throw new Error(errorMsg);
      }
      const result: ApiResponse<FinancialsData> = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Could not load financial data");
      }
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Erro ao carregar dados",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  // Early return or conditional rendering for loading/error state
  if (loading) {
     return (
        <Stack>
            <PageHeader title="Financeiro (Contas a Pagar)" />
            <LoadingOverlay visible={true} />
            <Text>Carregando dados financeiros...</Text>
        </Stack>
     );
  }

  if (!data) {
     return (
         <Stack>
             <PageHeader title="Financeiro (Contas a Pagar)" />
             <Alert color="red" title="Erro">
                 Não foi possível carregar os dados financeiros. Tente novamente mais tarde.
             </Alert>
         </Stack>
     );
  }


  return (
    <Stack>
      <PageHeader title="Financeiro (Contas a Pagar)" />
      {/* Loading overlay removed, handled by early return */}
      {/* <LoadingOverlay visible={loading} /> */}

      <Tabs defaultValue="staff" color="privacyGold">
        <Tabs.List>
          <Tabs.Tab value="staff" leftSection={<User size={16} />}>
            Staff
          </Tabs.Tab>
          <Tabs.Tab value="partners" leftSection={<Building size={16} />}>
            Parceiros
          </Tabs.Tab>
          <Tabs.Tab value="hostesses" leftSection={<Heart size={16} />}>
            Hostesses
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="staff" pt="md">
          {/* Ensure data?.staffCommissions matches StaffPayout[] type */}
          <StaffPayoutTable
            commissions={data.staffCommissions || []}
            onSuccess={fetchData}
          />
        </Tabs.Panel>

        <Tabs.Panel value="partners" pt="md">
           {/* Ensure data?.partnerPayouts matches PartnerPayoutItem[] type */}
          <PartnerPayoutTable
            payouts={data.partnerPayouts || []}
            onSuccess={fetchData}
          />
        </Tabs.Panel>

        <Tabs.Panel value="hostesses" pt="md">
          {/* Change prop name to 'data' and source to 'hostessPayouts' */}
          <HostessPayoutInfo
            data={data.hostessPayouts || []}
          />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
