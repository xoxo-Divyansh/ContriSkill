export const spacingTokens = {
  none: "0",
  xxs: "0.125rem",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  xxl: "2rem",
  section: "3rem"
} as const;

export type SpacingTokens = typeof spacingTokens;
