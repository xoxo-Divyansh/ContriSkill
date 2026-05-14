import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getWebEnv", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads NEXT_PUBLIC variables from explicit process.env references", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:4000");
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "ContriSkill Web");

    const { getWebEnv } = await import("../src/config/env");
    const env = getWebEnv();

    expect(env.appName).toBe("ContriSkill Web");
    expect(env.apiBaseUrl).toBe("http://localhost:4000/");
  });

  it("fails fast when NEXT_PUBLIC_API_BASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_NAME", "ContriSkill Web");

    const { getWebEnv } = await import("../src/config/env");

    expect(() => getWebEnv()).toThrow(
      '[env] Missing required environment variable "NEXT_PUBLIC_API_BASE_URL".'
    );
  });
});
