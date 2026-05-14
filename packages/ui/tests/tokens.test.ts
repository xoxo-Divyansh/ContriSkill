import { describe, expect, it } from "vitest";

import {
  colorTokens,
  designTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from "../src";

describe("design tokens", () => {
  it("exports canonical token groups", () => {
    expect(designTokens.colors).toBe(colorTokens);
    expect(designTokens.spacing).toBe(spacingTokens);
    expect(designTokens.typography).toBe(typographyTokens);
    expect(designTokens.radius).toBe(radiusTokens);
    expect(designTokens.shadows).toBe(shadowTokens);
  });

  it("provides expected baseline values", () => {
    expect(colorTokens.brand.primary).toBe("#2563eb");
    expect(spacingTokens.lg).toBe("1rem");
    expect(typographyTokens.fontSize.md).toBe("1rem");
    expect(radiusTokens.md).toBe("0.5rem");
    expect(shadowTokens.sm).toContain("rgb");
  });
});
