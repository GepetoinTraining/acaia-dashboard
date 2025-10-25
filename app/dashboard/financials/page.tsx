// File: app/dashboard/financials/page.tsx
"use client";

import { Text, Stack, LoadingOverlay, Alert, Tabs } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";
// Import HostessPayoutSummary explicitly if needed for casting, or rely on FinancialsData
// REMOVED HostessPayoutSummary import if not used elsewhere, FinancialsData simplified in types.ts
import { ApiResponse, FinancialsData } from "@/lib/types";
import { notifications } from "@mantine/notifications";
// Removed Heart icon
import { Building, CircleDollarSign, User } from "lucide-react";
import { StaffPayoutTable } from "./components/StaffPayoutTable";
import { PartnerPayoutTable } from "./components/PartnerPayoutTable";
// REMOVED HostessPayoutInfo import
// import { HostessPayoutInfo } from "./components/HostessPayoutInfo";

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
            // Ensure data structure matches simplified FinancialsData (no hostessPayouts expected)
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

            <Tabs defaultValue="staff" color="pastelGreen"> {/* Updated color */}
                <Tabs.List>
                    <Tabs.Tab value="staff" leftSection={<User size={16} />}>
                        Staff
                    </Tabs.Tab>
                    {/* Partner payouts might be removed if consignment is deferred further */}
                    {/* For now, keep it if Partner CRUD is still in */}
                    {/* <Tabs.Tab value="partners" leftSection={<Building size={16} />}>
                        Parceiros
                    </Tabs.Tab> */}
                    {/* REMOVED Hostesses Tab */}
                    {/* <Tabs.Tab value="hostesses" leftSection={<Heart size={16} />}>
                        Hostesses
                    </Tabs.Tab> */}
                </Tabs.List>

                <Tabs.Panel value="staff" pt="md">
                    <StaffPayoutTable
                        commissions={data.staffCommissions || []}
                        onSuccess={fetchData}
                    />
                </Tabs.Panel>

                 {/* REMOVED Partner Payout Panel or keep if needed */}
                {/* <Tabs.Panel value="partners" pt="md">
                    <PartnerPayoutTable
                        payouts={data.partnerPayouts || []} // This might error if partnerPayouts was removed from FinancialsData
                        onSuccess={fetchData}
                    />
                </Tabs.Panel> */}

                {/* REMOVED Hostesses Panel */}
                {/* <Tabs.Panel value="hostesses" pt="md">
                    <HostessPayoutInfo
                        data={data.hostessPayouts || []} // This will error as hostessPayouts is removed
                    />
                </Tabs.Panel> */}
            </Tabs>
        </Stack>
    );
}