// File: app/dashboard/components/LiveMap.tsx
"use client";

import { SimpleGrid, Paper, Title, Stack, Text, Group, Badge } from "@mantine/core";
import { LiveClient } from "@/lib/types"; // Import the correct LiveClient type
import { LiveClientCard } from "./LiveClientCard";
// --- Ensure SeatingArea, Visit, Client imports are present ---
import { SeatingArea, Visit, Client } from "@prisma/client";

// Define the shape of the data coming from the API (including the nested visit info)
// This type is used locally if needed, but the main data comes via props
type SeatingAreaWithVisit = SeatingArea & {
  visits: (Visit & { client: Client | null })[];
};

type LiveMapProps = {
  activeVisits: LiveClient[];
  // seatingAreas?: SeatingAreaWithVisit[]; // Optional: Pass areas to show occupancy map
};


export function LiveMap({ activeVisits }: LiveMapProps) {

  // Group visits by seatingAreaId for display (Optional Enhancement)
  const visitsByArea: { [key: number]: LiveClient[] } = {};
  const unassignedVisits: LiveClient[] = [];

  (activeVisits || []).forEach(visit => {
      if (visit?.seatingAreaId) {
          if (!visitsByArea[visit.seatingAreaId]) {
              visitsByArea[visit.seatingAreaId] = [];
          }
          visitsByArea[visit.seatingAreaId].push(visit);
      } else {
          if (visit) {
              unassignedVisits.push(visit);
          }
      }
  });


  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4}>Clientes Ativos ({activeVisits?.length ?? 0})</Title>
      <Text size="sm" c="dimmed" mb="md">
        Clientes que estão na casa com um check-in ativo.
      </Text>
      <Stack>
        {(activeVisits?.length ?? 0) > 0 ? (
          activeVisits.map((client) => (
            <LiveClientCard key={client.visitId} client={client} />
          ))
        ) : (
          <Text c="dimmed">Nenhum cliente na casa.</Text>
        )}
      </Stack>
       {unassignedVisits.length > 0 && (
           <>
                <Title order={5} mt="md">Clientes Aguardando Mesa ({unassignedVisits.length})</Title>
                <Stack mt="xs">
                    {unassignedVisits.map(client => (
                        <LiveClientCard key={client.visitId} client={client} />
                    ))}
                </Stack>
           </>
       )}
    </Paper>
  );
}