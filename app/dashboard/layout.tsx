"use client"; // <--- ADD THIS DIRECTIVE AT THE TOP

import { AppShell, Burger, Group, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { MainNav } from "./components/MainNav";
import { Notifications } from "@mantine/notifications";
import { Image } from "@mantine/core";
import { ReactNode } from "react";

// This is the main shell for the entire logged-in dashboard
export default function DashboardLayout({ children }: { children: ReactNode }) {
  // const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  // const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        // collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          {/* <Burger
            opened={mobileOpened}
            onClick={toggleMobile}
            hiddenFrom="sm"
            size="sm"
          />
          <Burger
            opened={desktopOpened}
            onClick={toggleDesktop}
            visibleFrom="sm"
            size="sm"
          /> */}
          {/* We'll use a placeholder for the logo */}
          <Image
            src="https://placehold.co/200x50/101113/FFB200?text=PRIVACY+CLUB"
            alt="Privacy Club Logo"
            w={200}
            h={40}
            fallbackSrc="https://placehold.co/200x50"
          />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <MainNav />
      </AppShell.Navbar>

      <AppShell.Main>
        {/* Add Mantine notifications provider */}
        <Notifications position="top-right" />
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
