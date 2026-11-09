import { createTheme } from "@mantine/core";

const ink = [
  "#f6f8fb",
  "#e6ebf2",
  "#c9d3e0",
  "#a7b6c8",
  "#8494aa",
  "#637389",
  "#465568",
  "#2d3b4c",
  "#1b2633",
  "#121920",
] as const;

export const theme = createTheme({
  primaryColor: "ink",
  primaryShade: 8,
  fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
  headings: {
    fontFamily: '"Fraunces", Georgia, serif',
    fontWeight: "560",
  },
  defaultRadius: "md",
  colors: { ink },
  cursorType: "pointer",
});
