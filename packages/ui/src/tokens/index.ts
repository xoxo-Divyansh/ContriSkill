import { colorTokens } from "./colors.js";
import { radiusTokens } from "./radius.js";
import { shadowTokens } from "./shadows.js";
import { spacingTokens } from "./spacing.js";
import { typographyTokens } from "./typography.js";

export * from "./colors.js";
export * from "./radius.js";
export * from "./shadows.js";
export * from "./spacing.js";
export * from "./typography.js";

export const designTokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  radius: radiusTokens,
  shadows: shadowTokens
} as const;

export type DesignTokens = typeof designTokens;
