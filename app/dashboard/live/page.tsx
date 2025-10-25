// File: app/dashboard/live/page.tsx (Simplified for Acaia MVP)
"use client";

import { Stack, LoadingOverlay, Alert, Center, Loader, Text } from "@mantine/core";
import { PageHeader } from "@/app/dashboard/components/PageHeader"; // Using alias
import { useState, useEffect } from "react";
import { ApiResponse, LiveData, LiveClient } from "@/lib/types"; // Removed LiveHostess
import { notifications } from "@mantine/notifications";
import { LiveMap } from "@/app/dashboard/components/LiveMap"; // Using alias
import { AlertCircle } from "lucide-react";

export default function LivePage() {
  const [liveClients, setLiveClients] = useState<LiveClient[]>([]);
  // Removed liveHostesses state
  // Removed products state (not needed directly on this page)

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch only necessary live data (clients/visits)
  const fetchLiveUpdates = async () => {
    // Determine if it's the initial load to set the correct loader
    const setLoading = loadingInitial ? setLoadingInitial : setLoadingUpdate;
    setLoading(true);
    if(loadingInitial) setError(null); // Clear error on initial fetch attempt

    try {
      // Reusing /api/live, but only using client data now
      const response = await fetch("/api/live");
      if (!response.ok) {
        const errorResult: ApiResponse = await response.json().catch(() => ({ success: false, error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }
      // Expect Partial<LiveData> because hostesses are missing
      const result: ApiResponse<Partial<LiveData>> = await response.json();
      if (result.success && result.data?.clients) {
        setLiveClients(result.data.clients);
        // Removed setLiveHostesses
        if (error && !loadingInitial) setError(null); // Clear polling error on success
      } else {
        throw new Error(result.error || "Could not load live client data");
      }
    } catch (error: any) {
      console.error("Error fetching live data:", error);
      setError(error.message);
       if(loadingInitial) { // Only show notification on initial load error
            notifications.show({
                title: "Erro ao carregar dados ao vivo",
                message: error.message,
                color: "red",
            });
       }
    } finally {
      setLoading(false);
      if(loadingInitial) setLoadingInitial(false); // Ensure initial loading is set false
    }
  };

  // Effect for initial data load
  useEffect(() => {
    fetchLiveUpdates(); // Call the combined fetch function initially
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs only once on mount

  // Effect for polling live updates
  useEffect(() => {
    if (loadingInitial) return; // Don't poll until initial load is done

    const interval = setInterval(fetchLiveUpdates, 15000); // Poll every 15 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [loadingInitial]); // Rerun effect when loadingInitial changes

  return (
    <Stack>
      <PageHeader title="Visão Geral Ao Vivo" />
      <Alert
        variant="light"
        color="blue"
        title="Atualização Periódica"
        icon={<AlertCircle />}
        >
        Esta página atualiza a lista de clientes a cada 15 segundos.
      </Alert>

      {/* Show initial loading overlay */}
      <LoadingOverlay visible={loadingInitial} overlayProps={{ radius: "sm", blur: 1 }} />

      {/* Show persistent error message if any load failed */}
      {error && !loadingInitial && (
         <Alert color="red" title="Erro ao Carregar/Atualizar Dados" icon={<AlertCircle />}>
           {error}. Tentando novamente em segundo plano.
         </Alert>
      )}

      {/* Render map if initial load succeeded */}
      {!loadingInitial && (
        <LiveMap activeVisits={liveClients} />
      )}

       {/* Optional: Show subtle indicator during background updates */}
       {loadingUpdate && !loadingInitial && <Text size="xs" c="dimmed" ta="center">Atualizando...</Text>}

       {/* Show placeholder ONLY during initial load if there's no error yet */}
       {loadingInitial && !error && (
         <Center h={300}>
            {/* Loader is handled by LoadingOverlay */}
         </Center>
       )}
    </Stack>
  );
}