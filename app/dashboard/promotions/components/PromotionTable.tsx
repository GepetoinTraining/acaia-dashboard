"use client";

import { Table, Badge, Text, Center, Loader, Group } from "@mantine/core";
import { PromotionWithProduct } from "../page";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.locale("pt-br");
dayjs.extend(relativeTime);

type PromotionTableProps = {
  promotions: PromotionWithProduct[];
  loading: boolean;
};

export function PromotionTable({ promotions, loading }: PromotionTableProps) {
  const now = dayjs();

  const rows = promotions.map((item) => {
    const isExpired = dayjs(item.expiresAt).isBefore(now);
    return (
      <Table.Tr key={item.id} style={{ opacity: isExpired ? 0.5 : 1 }}>
        <Table.Td>
          <Text fw={500}>{item.title}</Text>
          <Text size="xs" c="dimmed">
            {item.body}
          </Text>
        </Table.Td>
        <Table.Td>
          <Badge color={isExpired ? "gray" : "green"} variant="light">
            {isExpired ? "Expirada" : "Ativa"}
          </Badge>
        </Table.Td>
        <Table.Td>
          {item.product ? (
            <Badge color="blue">{item.product.name}</Badge>
          ) : (
            <Text size="sm" c="dimmed">
              N/A
            </Text>
          )}
        </Table.Td>
        <Table.Td>
          <Text fw={500}>{item.bonusOffer || "N/A"}</Text>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">
            {isExpired
              ? dayjs(item.expiresAt).format("DD/MM/YY")
              : dayjs(item.expiresAt).fromNow()}
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm" striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Promoção</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Produto Alvo</Table.Th>
            <Table.Th>Bônus</Table.Th>
            <Table.Th>Expira</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {loading ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Center h={200}>
                  <Loader color="privacyGold" />
                </Center>
              </Table.Td>
            </Table.Tr>
          ) : rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text ta="center" c="dimmed" py="lg">
                  Nenhuma promoção criada.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
