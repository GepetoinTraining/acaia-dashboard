"use client";

import { NavLink, Stack, Button, Text } from "@mantine/core";
import {
  LayoutDashboard,
  Users,
  // Heart, // Removed Hostess
  Martini,
  Archive,
  Calculator, // Used for POS
  UserPlus,
  // BadgePercent, // Removed Promotions
  Briefcase,
  LineChart,
  LogOut,
  Armchair, // Added icon for Seating
  Music, // Added icon for Entertainers
  Disc // Added icon for Vinyl
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react"; // Imported React for MouseEvent type

// Define the navigation links for Acaia
const links = [
  { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard/live" }, // Renamed from Live
  { icon: Calculator, label: "Nova Comanda", href: "/dashboard/pospage"}, // Renamed from PDV
  { icon: Users, label: "Clientes", href: "/dashboard/clients" },
  { icon: Armchair, label: "Mesas/Áreas", href: "/dashboard/seating" }, // Added Seating link
  { icon: Martini, label: "Produtos", href: "/dashboard/products" },
  { icon: Archive, label: "Inventário", href: "/dashboard/bar" }, // Renamed from Bar (Estoque)
  { icon: Music, label: "Artistas", href: "/dashboard/entertainers" }, // Added Entertainers link
  { icon: Disc, label: "Vinil", href: "/dashboard/vinyl" }, // Added Vinyl link
  { icon: UserPlus, label: "Equipe", href: "/dashboard/staff" }, // Renamed from Staff
  { icon: Briefcase, label: "Parceiros", href: "/dashboard/partners" }, // Kept for consignment
  // { icon: BadgePercent, label: "Promoções", href: "/dashboard/promotions" }, // Removed Promotions
  { icon: LineChart, label: "Relatórios", href: "/dashboard/reports" },
  // Removed: Hostesses, Caixa (Pagamentos) - financials might be separate
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

  // TODO: Fetch user name from session or context
  const userName = "Manager"; // Placeholder

  return (
    <Stack justify="space-between" style={{ height: "100%" }}>
      <Stack>
        {links.map((link) => (
          <NavLink
            key={link.label}
            href={link.href}
            label={link.label}
            leftSection={<link.icon size="1rem" />}
            // Use startsWith for parent routes, exact match otherwise (optional)
            active={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              router.push(link.href);
            }}
            variant="subtle"
            color="gray" // Default color
            // Mantine v7+ uses data-active attribute for styling active NavLink
            // Ensure your global CSS or theme handles [data-active] styling if needed
             styles={(theme) => ({
                 root: {
                    '&[data-active]': {
                        backgroundColor: theme.colors.pastelGreen[1],
                        color: theme.colors.pastelGreen[8],
                        fontWeight: 500,
                    },
                    '&[data-active] svg': {
                       color: theme.colors.pastelGreen[7],
                     },
                     // Add hover styles if desired
                     '&:hover:not([data-active])': {
                        // backgroundColor: theme.colors.gray[1], // Example hover
                     }
                 }
             })}
          />
        ))}
      </Stack>

      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Logado como: {userName}
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