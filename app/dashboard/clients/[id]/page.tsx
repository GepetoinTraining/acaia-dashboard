"use client";

import { Container, Title, Paper, Text, Loader, Center } from "@mantine/core";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientDetail } from "./components/ClientDetail";
import { ClientVisitHistory } from "./components/ClientVisitHistory";
// Import the correct, detailed type
import { ClientDetails, ApiResponse } from "@/lib/types";
import { Prisma } from "@prisma/client"; // Import Prisma for Decimal if needed later

// Update function return type to ClientDetails
async function getClientData(
  id: number
): Promise<ClientDetails | null> {
  try {
    const response = await fetch(`/api/clients/${id}`); // Uses the new GET handler
    if (!response.ok) {
       console.error("Failed to fetch client data:", response.statusText);
      return null;
    }
    // Expect ClientDetails in the response data
    const result: ApiResponse<ClientDetails> = await response.json();
    if (result.success && result.data) {
      // Potentially convert Decimal strings back to Decimal objects if needed by components
      // For now, assume components handle string/number representations or use Number()
      return result.data;
    }
     console.error("API Error:", result.error);
    return null;
  } catch (error) {
    console.error("Failed to fetch client data:", error);
    return null;
  }
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  // Update state variable type to ClientDetails
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(id)) {
      setLoading(false);
      // Maybe redirect or show a clearer error message
      console.error("Invalid client ID parameter.");
      return;
    }

    getClientData(id)
      .then((data) => {
        setClient(data);
      })
      .catch((error) => {
         // Handle errors during the fetch promise itself
         console.error("Error fetching client data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]); // Dependency array is correct

  if (loading) {
    return (
      <Center h="50vh">
        <Loader color="privacyGold" />
      </Center>
    );
  }

  if (!client) {
    return (
      <Container fluid>
        <Title order={2} mb="lg">
          Cliente não encontrado
        </Title>
        <Paper withBorder shadow="md" p="lg">
          <Text>
            O cliente com o ID {id} não foi encontrado no sistema ou houve um erro ao carregar os dados.
          </Text>
        </Paper>
      </Container>
    );
  }

  // Now 'client' matches the type expected by ClientDetail
  return (
    <Container fluid>
      <Title order={2} mb="lg">
        {/* Use optional chaining for safety, although client should exist here */}
        Perfil do Cliente: {client?.name || `Cliente #${client?.id}`}
      </Title>
      {/* Pass the correctly typed client object */}
      <ClientDetail client={client} />
      {/* Pass the visits array from the client object */}
      <ClientVisitHistory visits={client.visits} />
    </Container>
  );
}
