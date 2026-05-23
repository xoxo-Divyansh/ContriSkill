import { describe, expect, it } from "vitest";

import { parseWebEnv } from "../src/config/env-schema";

describe("parseWebEnv", () => {
  it("parses required web env", () => {
    const env = parseWebEnv({
      NEXT_PUBLIC_APP_NAME: "ContriSkill",
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000"
    });

    expect(env.appName).toBe("ContriSkill");
    expect(env.apiBaseUrl).toBe("http://localhost:4000/");
    expect(env.realtimeUrl).toBe("ws://localhost:4000/api/v1/realtime");
  });

  it("fails fast when NEXT_PUBLIC_API_BASE_URL is missing", () => {
    expect(() => parseWebEnv({})).toThrow(
      '[env] Missing required environment variable "NEXT_PUBLIC_API_BASE_URL". Set it in apps/web/.env.local (see apps/web/.env.example).'
    );
  });
});
