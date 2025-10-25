import "@mantine/core/styles.css";
import "./globals.css";

import React from "react";
import { ColorSchemeScript } from "@mantine/core";
import { MantineProvider } from "./components/MantineProvider";

export const metadata = {
  title: "Privacy Club - Dashboard",
  description: "Dashboard de Gerenciamento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
