// File: app/dashboard/financials/page.tsx
"use client";

import { Text, Stack, LoadingOverlay, Alert, Tabs } from "@mantine/core";
import { PageHeader } from "../components/PageHeader";
import { useState, useEffect } from "react";
import { ApiResponse, FinancialsData } from "@/lib/types";
import { notifications } from "@mantine/notifications";
import { Building, CircleDollarSign, User } from "lucide-react";
import { StaffPayoutTable } from "./components/StaffPayoutTable";
// --- FIX: Remove the import for the non-existent component ---
// import { PartnerPayoutTable } from "./components/PartnerPayoutTable";


export default function FinancialsPage() {
    const [data, setData] = useState<FinancialsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/financials");
            if (!response.ok) {
                let errorMsg = "Failed to fetch financial data";
                try {
                    const errorResult: ApiResponse = await response.json();
                    if (errorResult.error) {
                        errorMsg = errorResult.error;
                    }
                } catch (parseError) { /* Ignore */ }
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
            setData(null); // Ensure data is null on error
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <Stack>
                <PageHeader title="Financeiro (Comissões Staff)" /> {/* Updated title */}
                <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 1 }}/>
                {/* <Text>Carregando dados financeiros...</Text> */}
            </Stack>
        );
    }

    if (!data) {
        return (
            <Stack>
                <PageHeader title="Financeiro (Comissões Staff)" /> {/* Updated title */}
                <Alert color="red" title="Erro">
                    Não foi possível carregar os dados financeiros. Tente recarregar a página.
                </Alert>
            </Stack>
        );
    }


    return (
        <Stack>
            <PageHeader title="Financeiro (Comissões Staff)" /> {/* Updated title */}

            {/* Simplified Tabs - Only Staff */}
            <Tabs defaultValue="staff" color="pastelGreen">
                <Tabs.List>
                    <Tabs.Tab value="staff" leftSection={<User size={16} />}>
                        Comissões Staff
                    </Tabs.Tab>
                    {/* Removed Partner Tab */}
                    {/* <Tabs.Tab value="partners" leftSection={<Building size={16} />}>
                        Parceiros
                    </Tabs.Tab> */}
                </Tabs.List>

                <Tabs.Panel value="staff" pt="md">
                    <StaffPayoutTable
                        // Ensure commissions is always an array
                        commissions={data.staffCommissions || []}
                        onSuccess={fetchData}
                    />
                </Tabs.Panel>

                 {/* Removed Partner Panel */}
                {/* <Tabs.Panel value="partners" pt="md"> ... </Tabs.Panel> */}

            </Tabs>
        </Stack>
    );
}