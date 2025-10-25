"use client";

import { CartItem } from "@/lib/types";
import {
  Table,
  Text,
  ActionIcon,
  NumberInput,
  ScrollArea,
  Center,
} from "@mantine/core";
import { Trash } from "lucide-react";

type CartProps = {
  cart: CartItem[];
  onSetCart: (cart: CartItem[]) => void;
};

export function Cart({ cart, onSetCart }: CartProps) {
  const updateQuantity = (productId: number, quantity: number | string) => { // Allow string from NumberInput
    const numericQuantity = Number(quantity); // Convert input to number
    if (numericQuantity <= 0) {
      removeItem(productId);
    } else {
      onSetCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity: numericQuantity } : item
        )
      );
    }
  };

  const removeItem = (productId: number) => {
    onSetCart(cart.filter((item) => item.product.id !== productId));
  };

  const rows = cart.map((item) => {
    // Convert Decimal salePrice to number for calculations/display
    const salePriceNumber = Number(item.product.salePrice);
    const itemTotal = salePriceNumber * item.quantity;

    return (
      <Table.Tr key={item.product.id}>
        <Table.Td>
          <Text size="sm" fw={500}>
            {item.product.name}
          </Text>
          <Text size="xs" c="dimmed">
            {/* Display the number version */}
            R$ {salePriceNumber.toFixed(2)}
          </Text>
        </Table.Td>
        <Table.Td>
          <NumberInput
            value={item.quantity}
            onChange={(val) => updateQuantity(item.product.id, val)} // Pass val directly
            min={1}
            step={1} // Use step 1 for quantity
            // max={100} // Consider removing max or setting based on stock
            size="xs"
            w={70}
          />
        </Table.Td>
        <Table.Td>
          <Text size="sm" fw={500}>
            {/* Display the calculated itemTotal */}
            R$ {itemTotal.toFixed(2)}
          </Text>
        </Table.Td>
        <Table.Td>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => removeItem(item.product.id)}
          >
            <Trash size={16} />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    );
});


  return (
    <ScrollArea h={300} style={{ flexGrow: 1 }}>
      {cart.length === 0 ? (
        <Center h="100%">
          <Text c="dimmed">O carrinho está vazio.</Text>
        </Center>
      ) : (
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Qtd.</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Rem</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </ScrollArea>
  );
}
