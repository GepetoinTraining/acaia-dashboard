// File: app/dashboard/vinyl/components/VinylRecordTable.tsx
"use client";

import { Table, Text, Center, Loader, ActionIcon, Group, Tooltip } from "@mantine/core";
import { VinylRecord } from "@prisma/client";
import { Pencil, Trash } from "lucide-react";

type VinylRecordTableProps = {
    vinylRecords: VinylRecord[];
    loading: boolean;
    onEdit: (record: VinylRecord) => void;
    onDelete: (record: VinylRecord) => void;
};

export function VinylRecordTable({
    vinylRecords,
    loading,
    onEdit,
    onDelete
}: VinylRecordTableProps) {

    const rows = vinylRecords.map((item) => (
        <Table.Tr key={item.id}>
            <Table.Td>
                <Text fw={500}>{item.artist}</Text>
            </Table.Td>
            <Table.Td>
                <Text>{item.title}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm" c="dimmed">{item.genre || "N/A"}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{item.year || "N/A"}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{item.timesPlayed}</Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Editar" withArrow position="left">
                        <ActionIcon variant="light" color="blue" onClick={() => onEdit(item)}>
                            <Pencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Excluir" withArrow position="right">
                        <ActionIcon variant="light" color="red" onClick={() => onDelete(item)}>
                            <Trash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const colSpan = 6; // Number of columns

    return (
        <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Artista</Table.Th>
                        <Table.Th>Título</Table.Th>
                        <Table.Th>Gênero</Table.Th>
                        <Table.Th>Ano</Table.Th>
                        <Table.Th>Vezes Tocado</Table.Th>
                        <Table.Th>Ações</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {loading ? (
                        <Table.Tr>
                            <Table.Td colSpan={colSpan}>
                                <Center h={200}>
                                    <Loader color="pastelGreen" />
                                </Center>
                            </Table.Td>
                        </Table.Tr>
                    ) : rows.length > 0 ? (
                        rows
                    ) : (
                        <Table.Tr>
                            <Table.Td colSpan={colSpan}>
                                <Text ta="center" c="dimmed" py="lg">
                                    Nenhum disco de vinil encontrado. Clique em "Adicionar Disco" para começar.
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
}