"use client";

import { NavLink, Stack, Button, Text } from "@mantine/core";
import {
  LayoutDashboard,
  Users,
  Heart,
  Martini,
  Archive,
  Calculator,
  UserPlus,
  BadgePercent,
  Briefcase,
  LineChart,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react"; // Imported React for MouseEvent type

// Define the navigation links
const links = [
  { icon: LayoutDashboard, label: "Live", href: "/dashboard/live" },
  { icon: Users, label: "Clientes", href: "/dashboard/clients" },
  { icon: Heart, label: "Hostesses", href: "/dashboard/hostesses" },
  { icon: Martini, label: "Produtos", href: "/dashboard/products" },
  { icon: Archive, label: "Bar (Estoque)", href: "/dashboard/bar" },
  { icon: Calculator, label: "Caixa (Pagamentos)", href: "/dashboard/cashier" }, // Changed name to match MainNav link
  { icon: UserPlus, label: "Staff", href: "/dashboard/staff" },
  { icon: BadgePercent, label: "Promoções", href: "/dashboard/promotions" },
  { icon: Briefcase, label: "Parceiros", href: "/dashboard/partners" },
  { icon: LineChart, label: "Relatórios", href: "/dashboard/reports" },
  { icon: Calculator /* Using Calculator icon again */, label: "PDV", href: "/dashboard/pospage"}, // Added POS Page link
];

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    // Call the logout API
    await fetch("/api/auth", { method: "DELETE" });
    // Redirect to login page
    router.push("/");
  };

  return (
    <Stack justify="space-between" style={{ height: "100%" }}>
      <Stack>
        {links.map((link) => (
          <NavLink
            key={link.label}
            href={link.href}
            label={link.label}
            leftSection={<link.icon size="1rem" />}
            active={pathname.startsWith(link.href)}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { // Used React.MouseEvent
              e.preventDefault();
              router.push(link.href);
            }}
            variant="filled"
            // Removed the invalid radius prop
            // radius="md"
          />
        ))}
      </Stack>

      <Stack>
        {/* TODO: Add user name from session */}
        <Text size="sm" c="dimmed">
          Logado como: Admin
        </Text>
        <Button
          onClick={handleLogout}
          variant="light"
          color="red"
          leftSection={<LogOut size="1rem" />}
        >
          Sair
        </Button>
      </Stack>
    </Stack>
  );
}

