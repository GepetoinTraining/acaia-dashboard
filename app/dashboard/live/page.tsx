"use client";

import { Stack, LoadingOverlay, Alert, Center, Loader, Text } from "@mantine/core"; // Added Text
import { PageHeader } from "@/app/dashboard/components/PageHeader"; // Using alias for consistency
import { useState, useEffect } from "react";
// Import specific types needed
import { ApiResponse, LiveData, LiveClient, LiveHostess } from "@/lib/types";
import { Product } from "@prisma/client"; // Import Product type
import { notifications } from "@mantine/notifications";
// --- Changed import path to use alias ---
import { LiveMap } from "@/app/dashboard/components/LiveMap";
// --- End of change ---
import { AlertCircle } from "lucide-react";

export default function LivePage() {
  // Separate state for different data types
  const [liveClients, setLiveClients] = useState<LiveClient[]>([]);
  const [liveHostesses, setLiveHostesses] = useState<LiveHostess[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // State for products

  // Separate loading states
  const [loadingInitial, setLoadingInitial] = useState(true); // For the first load (including products)
  const [loadingUpdate, setLoadingUpdate] = useState(false); // For subsequent polling updates (clients/hostesses only)
  const [error, setError] = useState<string | null>(null); // State for error messages


  // Fetch ALL data initially, including products
  const fetchInitialData = async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const response = await fetch("/api/live");
      if (!response.ok) {
        const errorResult: ApiResponse = await response.json().catch(() => ({ success: false, error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<LiveData> = await response.json();
      if (result.success && result.data) {
        setLiveClients(result.data.clients);
        setLiveHostesses(result.data.hostesses);
        setProducts(result.data.products); // Set products only on initial load
      } else {
        throw new Error(result.error || "Could not load initial live data");
      }
    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      setError(error.message);
      notifications.show({
        title: "Erro ao carregar dados iniciais",
        message: error.message,
        color: "red",
      });
    } finally {
      setLoadingInitial(false);
    }
  };

  // Fetch ONLY dynamic data (clients, hostesses) for polling
  const fetchLiveUpdates = async () => {
    // setLoadingUpdate(true); // Optionally show subtle loading
    try {
      const response = await fetch("/api/live");
      if (!response.ok) {
         console.error(`Live update failed: ${response.status}`);
         // Optionally set error state to show persistent background error
         // setError(`Falha na atualização: ${response.status}`);
         return; // Skip update on error
      }
      const result: ApiResponse<LiveData> = await response.json();
      if (result.success && result.data) {
        setLiveClients(result.data.clients);
        setLiveHostesses(result.data.hostesses);
         if (error) setError(null); // Clear error on successful update
      } else {
        console.error("Live update failed:", result.error);
        // setError(result.error || "Could not process live update data");
      }
    } catch (error: any) {
      console.error("Error fetching live updates:", error);
      // setError(error.message);
    } finally {
       // setLoadingUpdate(false);
    }
  };

  // Effect for initial data load (including products)
  useEffect(() => {
    fetchInitialData();
  }, []); // Runs only once on mount

  // Effect for polling live updates (clients/hostesses)
  useEffect(() => {
    if (loadingInitial) {
      return; // Don't start polling until initial load is done
    }
    // Fetch immediately once initial load is done before starting interval
    fetchLiveUpdates();
    const interval = setInterval(fetchLiveUpdates, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [loadingInitial]); // Rerun effect when loadingInitial changes

  return (
    <Stack>
      <PageHeader title="Live Map" />
      <Alert
        variant="light"
        color="blue"
        title="Atualização em Tempo Real"
        icon={<AlertCircle />}
      >
        Este mapa atualiza clientes e hostesses a cada 10 segundos.
      </Alert>

      {/* Show initial loading overlay */}
      <LoadingOverlay visible={loadingInitial} overlayProps={{ radius: "sm", blur: 1 }} />

      {/* Show persistent error message if any load failed */}
      {error && !loadingInitial && (
         <Alert color="red" title="Erro ao Carregar/Atualizar Dados" icon={<AlertCircle />}>
           {error}. Tentando novamente em segundo plano. Verifique a conexão ou o console do servidor.
         </Alert>
      )}

      {/* Render map if initial load succeeded, even if subsequent updates fail */}
      {!loadingInitial && products.length > 0 && (
        <LiveMap
          clients={liveClients}
          hostesses={liveHostesses}
        />
      )}

      {/* Optional: Show subtle indicator during background updates */}
      {/* {loadingUpdate && !loadingInitial && <Text size="xs" c="dimmed" ta="center">Atualizando...</Text>} */}

      {/* Show placeholder ONLY during initial load OR if initial load failed with NO data */}
       {loadingInitial || (!loadingInitial && products.length === 0 && !error) ? (
         <Center h={300}>
            {/* Loader is handled by LoadingOverlay during initial load */}
            {!loadingInitial && !error && <Text c="dimmed">Nenhum dado ao vivo disponível.</Text>}
         </Center>
       ) : null} {/* Don't show placeholder if map is rendered or error is shown */}
    </Stack>
  );
}

