export const radiusTokens = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  pill: "9999px"
} as const;

export type RadiusTokens = typeof radiusTokens;
