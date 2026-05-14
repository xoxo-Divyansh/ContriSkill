import { describe, expect, it } from "vitest";

import { defaultTheme, resolveThemeValue, ThemeProvider, themeModes } from "../src";

describe("ThemeProvider foundation", () => {
  it("exports expected provider symbols", () => {
    expect(typeof ThemeProvider).toBe("function");
    expect(themeModes).toEqual(["light", "dark"]);
  });

  it("resolves default theme when no value is provided", () => {
    expect(resolveThemeValue(undefined)).toEqual(defaultTheme);
  });

  it("resolves explicit mode overrides", () => {
    const resolved = resolveThemeValue({ mode: "dark" });
    expect(resolved.mode).toBe("dark");
    expect(resolved.tokens).toBe(defaultTheme.tokens);
  });
});
