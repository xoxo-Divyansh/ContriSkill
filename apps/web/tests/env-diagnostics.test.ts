import { describe, expect, it } from "vitest";

import { getWebStartupDiagnostics, parseWebEnv } from "../src/config/env-schema";

describe("getWebStartupDiagnostics", () => {
  it("documents derived realtime url behavior", () => {
    const raw = {
      NEXT_PUBLIC_APP_NAME: "ContriSkill",
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000"
    };
    const env = parseWebEnv(raw);

    expect(getWebStartupDiagnostics(env, raw)).toEqual({
      appName: "ContriSkill",
      apiBaseUrl: "http://localhost:4000/",
      realtimeUrl: "ws://localhost:4000/api/v1/realtime",
      hasExplicitRealtimeUrl: false
    });
  });
});
