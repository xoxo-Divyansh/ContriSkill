export const colorTokens = {
  background: {
    canvas: "#f8fafc",
    surface: "#ffffff",
    subtle: "#f1f5f9"
  },
  text: {
    primary: "#0f172a",
    secondary: "#334155",
    muted: "#64748b",
    inverse: "#f8fafc"
  },
  border: {
    subtle: "#e2e8f0",
    strong: "#94a3b8",
    focus: "#2563eb"
  },
  brand: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    success: "#16a34a",
    warning: "#d97706",
    danger: "#dc2626"
  }
} as const;

export type ColorTokens = typeof colorTokens;
