// File: app/dashboard/components/LiveMap.tsx (Simplified for Acaia MVP)
"use client";

import { SimpleGrid, Paper, Title, Stack, Text, Group, Badge } from "@mantine/core";
import { LiveClient } from "@/lib/types"; // Import the correct LiveClient type
import { LiveClientCard } from "./LiveClientCard";
// --- FIX: Add SeatingArea, Visit, Client imports ---
import { SeatingArea, Visit, Client } from "@prisma/client";

// Define the shape of the data coming from the API (including the nested visit info)
// This type is used locally if needed, but the main data comes via props
type SeatingAreaWithVisit = SeatingArea & {
  // --- FIX: Ensure Visit and Client types are available via import ---
  visits: (Visit & { client: Client | null })[];
};

type LiveMapProps = {
  // Pass active visits/clients
  activeVisits: LiveClient[];
  // seatingAreas?: SeatingAreaWithVisit[]; // Optional: Pass areas to show occupancy map
};


export function LiveMap({ activeVisits }: LiveMapProps) {

  // Group visits by seatingAreaId for display (Optional Enhancement)
  const visitsByArea: { [key: number]: LiveClient[] } = {};
  const unassignedVisits: LiveClient[] = [];

  // Add null check for activeVisits before iterating
  (activeVisits || []).forEach(visit => {
      // Use optional chaining for safety
      if (visit?.seatingAreaId) {
          if (!visitsByArea[visit.seatingAreaId]) {
              visitsByArea[visit.seatingAreaId] = [];
          }
          visitsByArea[visit.seatingAreaId].push(visit);
      } else {
          // Add null/undefined check for visit itself
          if (visit) {
              unassignedVisits.push(visit);
          }
      }
  });


  return (
    <Paper withBorder p="md" radius="md">
      <Title order={4}>Clientes Ativos ({activeVisits?.length ?? 0})</Title> {/* Added null check */}
      <Text size="sm" c="dimmed" mb="md">
        Clientes que estão na casa com um check-in ativo.
      </Text>
      <Stack>
        {/* Added null check */}
        {(activeVisits?.length ?? 0) > 0 ? (
          activeVisits.map((client) => (
            // Use LiveClientCard component
            <LiveClientCard key={client.visitId} client={client} />
          ))
        ) : (
          <Text c="dimmed">Nenhum cliente na casa.</Text>
        )}
      </Stack>
      {/* Example of showing unassigned clients if any */}
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