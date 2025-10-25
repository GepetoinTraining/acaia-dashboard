// File: app/dashboard/components/LiveMap.tsx (Simplified for Acaia MVP)
"use client";

import { SimpleGrid, Paper, Title, Stack, Text, Group } from "@mantine/core";
import { LiveClient } from "@/lib/types"; // Removed LiveHostess
import { LiveClientCard } from "./LiveClientCard"; // Removed LiveHostessCard import
import { SeatingArea } from "@prisma/client"; // Import SeatingArea if showing tables

// Define the shape of the data coming from the API (including the nested visit info)
type SeatingAreaWithVisit = SeatingArea & {
  visits: (Visit & { client: Client | null })[];
};

type LiveMapProps = {
  // Pass active visits/clients, maybe areas too
  activeVisits: LiveClient[]; // Using the simplified LiveClient type
  // seatingAreas?: SeatingAreaWithVisit[]; // Optional: Pass areas to show occupancy map
};


export function LiveMap({ activeVisits }: LiveMapProps) {

  // Group visits by seatingAreaId for display (Optional Enhancement)
  const visitsByArea: { [key: number]: LiveClient[] } = {};
  const unassignedVisits: LiveClient[] = [];

  activeVisits.forEach(visit => {
      if (visit.seatingAreaId) {
          if (!visitsByArea[visit.seatingAreaId]) {
              visitsByArea[visit.seatingAreaId] = [];
          }
          visitsByArea[visit.seatingAreaId].push(visit);
      } else {
          unassignedVisits.push(visit);
      }
  });


  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4}>Clientes Ativos ({activeVisits.length})</Title>
      <Text size="sm" c="dimmed" mb="md">
        Clientes que estão na casa com um check-in ativo.
      </Text>
      <Stack>
        {activeVisits.length > 0 ? (
          activeVisits.map((client) => (
            // LiveClientCard might need adjustment if credit was removed from LiveClient type
            <Paper key={client.visitId} p="xs" withBorder radius="sm">
                <Group justify="space-between">
                    <Text size="sm" fw={500}>{client.name || `Visita #${client.visitId}`}</Text>
                    {client.seatingAreaName && <Badge size="sm">{client.seatingAreaName}</Badge>}
                </Group>
            </Paper>
            // Replace above Paper with updated LiveClientCard if preferred
            // <LiveClientCard key={client.visitId} client={client} />
          ))
        ) : (
          <Text c="dimmed">Nenhum cliente na casa.</Text>
        )}
      </Stack>
      {/* Add logic here to display occupied tables based on visitsByArea if needed */}
    </Paper>

    // Removed the second column for Hostesses
  );
}