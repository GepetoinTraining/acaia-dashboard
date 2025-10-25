// File: app/dashboard/components/MainNav.tsx
"use client";

import { NavLink, Stack, Button, Text, Skeleton } from "@mantine/core"; // Added Skeleton
import {
    LayoutDashboard, Users, Martini, Archive, Calculator,
    UserPlus, Briefcase, LineChart, LogOut, Armchair, Music, Disc
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react"; // Added useState, useEffect
import { ApiResponse, StaffSession } from "@/lib/types"; // Added StaffSession

// Define the navigation links for Acaia
const links = [
    { icon: LayoutDashboard, label: "Visão Geral", href: "/dashboard/live" },
    { icon: Calculator, label: "Nova Comanda", href: "/dashboard/pospage" },
    { icon: Users, label: "Clientes", href: "/dashboard/clients" },
    { icon: Armchair, label: "Mesas/Áreas", href: "/dashboard/seating" },
    { icon: Martini, label: "Produtos", href: "/dashboard/products" },
    { icon: Archive, label: "Inventário", href: "/dashboard/bar" },
    { icon: Music, label: "Artistas", href: "/dashboard/entertainers" }, // Added
    { icon: Disc, label: "Vinil", href: "/dashboard/vinyl" },          // Added
    { icon: UserPlus, label: "Equipe", href: "/dashboard/staff" },
    { icon: Briefcase, label: "Parceiros", href: "/dashboard/partners" },
    // { icon: BadgePercent, label: "Promoções", href: "/dashboard/promotions" }, // Removed
    { icon: LineChart, label: "Relatórios", href: "/dashboard/reports" },
];

// Helper function to fetch session (client-side)
async function getClientSession(): Promise<StaffSession | null> {
    try {
        const res = await fetch('/api/session'); // We need to create this simple endpoint
        if (!res.ok) return null;
        const data: ApiResponse<StaffSession> = await res.json();
        return data.success && data.data ? data.data : null;
    } catch (error) {
        console.error("Failed to fetch client session:", error);
        return null;
    }
}


export function MainNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState<string | null>(null); // State for user name
    const [loadingSession, setLoadingSession] = useState(true);

    // Fetch session on component mount
    useEffect(() => {
        getClientSession().then(session => {
            if (session) {
                setUserName(session.name);
            } else {
                // Handle case where session might not be available (e.g., redirect?)
                // For now, just leave name null or set a default
                console.warn("No active session found for MainNav.");
            }
            setLoadingSession(false);
        });
    }, []);


    const handleLogout = async () => {
        // Call the logout API
        await fetch("/api/auth", { method: "DELETE" });
        // Redirect to login page
        router.push("/");
        router.refresh(); // Ensure page reloads state
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
                        active={pathname === link.href || (link.href !== '/dashboard/live' && pathname.startsWith(link.href))} // Adjusted active logic slightly
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            router.push(link.href);
                        }}
                        variant="subtle"
                        color="gray"
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
                            }
                        })}
                    />
                ))}
            </Stack>

            <Stack gap="xs">
                 {/* Display username or skeleton while loading */}
                 {loadingSession ? (
                    <Skeleton height={15} width="70%" radius="sm" />
                 ) : (
                     <Text size="sm" c="dimmed" truncate> {/* Added truncate */}
                         Logado como: {userName || 'Usuário'} {/* Fallback text */}
                     </Text>
                 )}
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