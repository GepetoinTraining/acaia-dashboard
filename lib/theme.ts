"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

// Define a Pastel Green
const pastelGreen: MantineColorsTuple = [
  "#e6fcf5", // Lightest
  "#d5f9ec",
  "#aef2d8",
  "#85ebc2", // Primary light shade?
  "#62e4ae", // Main shade?
  "#4add9f",
  "#3cc997", // Darker shade?
  "#30b184",
  "#249c73",
  "#138663"  // Darkest
];

export const theme = createTheme({
  primaryColor: "pastelGreen", // Change primary color
  colors: {
    pastelGreen, // Add the new color
  },
  // ... keep other theme settings like fontFamily ...
  // Adjust dark mode if needed - pastel on dark can be tricky
  // defaultColorScheme: "light", // Maybe default to light theme?
});

export const theme = createTheme({
  /** Put your mantine theme override here */
  // colorScheme: "dark", // REMOVED: Set in MantineProvider instead for v8
  primaryColor: "privacyGold",
  colors: {
    privacyGold,
  },
  fontFamily: "Inter, sans-serif",
  headings: {
    fontFamily: "Inter, sans-serif",
    fontWeight: "600",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
      },
    },
    // Ensure Input styles are compatible with v8 if needed
    // Input might now be TextInput, NumberInput etc. specific styles
    // Or use InputWrapper
  },
});
