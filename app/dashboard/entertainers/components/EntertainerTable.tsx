// File: app/dashboard/entertainers/components/EntertainerTable.tsx
"use client";

import { Table, Badge, Text, Center, Loader, ActionIcon, Group, Tooltip, Switch } from "@mantine/core";
import { Entertainer } from "@prisma/client";
import { Pencil, Trash } from "lucide-react";
import dayjs from "dayjs"; // To format createdAt

type EntertainerTableProps = {
    entertainers: Entertainer[];
    loading: boolean;
    onEdit: (entertainer: Entertainer) => void;
    onDelete: (entertainer: Entertainer) => void;
    onToggleActive?: (entertainer: Entertainer, isActive: boolean) => void;
};

export function EntertainerTable({
    entertainers,
    loading,
    onEdit,
    onDelete,
    onToggleActive
}: EntertainerTableProps) {

    const rows = entertainers.map((item) => (
        <Table.Tr key={item.id} style={{ opacity: item.isActive ? 1 : 0.5 }}>
            <Table.Td>
                <Text fw={500}>{item.name}</Text>
                <Text size="xs" c="dimmed">ID: {item.id}</Text>
            </Table.Td>
            <Table.Td>
                <Badge variant="light" color="blue">
                    {item.type}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{item.contactNotes || "N/A"}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color={item.isActive ? "green" : "gray"} variant={item.isActive ? "light" : "outline"}>
                    {item.isActive ? "Ativo" : "Inativo"}
                </Badge>
            </Table.Td>
             <Table.Td>
                <Text size="sm" c="dimmed">
                     {dayjs(item.createdAt).format("DD/MM/YYYY")}
                </Text>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" wrap="nowrap">
                    {onToggleActive && (
                        <Tooltip label={item.isActive ? "Desativar" : "Ativar"} withArrow position="left">
                            <Switch
                                size="sm"
                                checked={item.isActive}
                                onChange={(event) => onToggleActive(item, event.currentTarget.checked)}
                                aria-label={item.isActive ? `Desativar ${item.name}` : `Ativar ${item.name}`}
                            />
                        </Tooltip>
                    )}
                    <Tooltip label="Editar" withArrow position="left">
                        <ActionIcon variant="light" color="blue" onClick={() => onEdit(item)}>
                            <Pencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {/* The delete button now triggers the modal in the parent */}
                    <Tooltip label="Desativar" withArrow position="right">
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
                        <Table.Th>Nome / ID</Table.Th>
                        <Table.Th>Tipo</Table.Th>
                        <Table.Th>Notas</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Criado em</Table.Th>
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
                                    Nenhum artista encontrado. Clique em "Adicionar Artista" para começar.
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
        </Table.ScrollContainer>
    );
}