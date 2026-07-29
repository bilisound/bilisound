import type { TailwindScale, ThemePalette } from "./types";

export const neutralPalette = {
  "50": "#f8fafc",
  "100": "#f1f5f9",
  "200": "#e2e8f0",
  "300": "#cbd5e1",
  "400": "#94a3b8",
  "500": "#64748b",
  "600": "#475569",
  "700": "#334155",
  "800": "#1e293b",
  "900": "#0f172a",
  "950": "#020617",
} satisfies TailwindScale;

export const classicPalette = {
  primary: {
    "50": "#eefffa",
    "100": "#c6fff1",
    "200": "#8effe6",
    "300": "#4dfbd8",
    "400": "#19e8c4",
    "500": "#00ba9d",
    "600": "#00a48e",
    "700": "#028373",
    "800": "#08675d",
    "900": "#0c554d",
    "950": "#003431",
  },
  accent: {
    "50": "#eff6ff",
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
    "800": "#1e40af",
    "900": "#1e3a8a",
    "950": "#172554",
  },
} satisfies ThemePalette;

export const redPalette = {
  primary: {
    "50": "#fef2f2",
    "100": "#fde6e7",
    "200": "#fad1d4",
    "300": "#f6abb1",
    "400": "#f07c88",
    "500": "#e64f62",
    "600": "#d22c49",
    "700": "#b0203c",
    "800": "#941d39",
    "900": "#7f1c37",
    "950": "#460b18",
  },
  accent: {
    "50": "#fff7ed",
    "100": "#ffedd5",
    "200": "#fed7aa",
    "300": "#fdba74",
    "400": "#fb923c",
    "500": "#f97316",
    "600": "#ea580c",
    "700": "#c2410c",
    "800": "#9a3412",
    "900": "#7c2d12",
    "950": "#431407",
  },
} satisfies ThemePalette;

export const positivePalette = {
  "50": "#caffe8",
  "100": "#a2f1c0",
  "200": "#84d3a2",
  "300": "#66b584",
  "400": "#489766",
  "500": "#348352",
  "600": "#2a7948",
  "700": "#206f3e",
  "800": "#166534",
  "900": "#14532d",
  "950": "#1b3224",
} satisfies TailwindScale;

export const negativePalette = {
  "50": "#fee2e2",
  "100": "#fecaca",
  "200": "#fca5a5",
  "300": "#f87171",
  "400": "#ef4444",
  "500": "#e63535",
  "600": "#dc2626",
  "700": "#b91c1c",
  "800": "#991b1b",
  "900": "#7f1d1d",
  "950": "#531313",
} satisfies TailwindScale;
