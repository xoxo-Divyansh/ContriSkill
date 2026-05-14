export const shadowTokens = {
  none: "none",
  sm: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
  md: "0 4px 6px -1px rgb(15 23 42 / 0.1)",
  lg: "0 10px 15px -3px rgb(15 23 42 / 0.15)"
} as const;

export type ShadowTokens = typeof shadowTokens;
