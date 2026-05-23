import { describe, expect, it } from "vitest";

import { getApiStartupDiagnostics, parseApiEnv } from "../src/config/env-schema";

describe("getApiStartupDiagnostics", () => {
  it("summarizes runtime-safe startup configuration", () => {
    const env = parseApiEnv({
      NODE_ENV: "development",
      API_PORT: "4000",
      WS_CORS_ORIGIN: "http://localhost:3000",
      SESSION_TTL_MINUTES: "30",
      DATABASE_URL: "postgres://postgres:postgres@localhost:5432/contriskill"
    });

    expect(getApiStartupDiagnostics(env)).toEqual({
      nodeEnv: "development",
      logLevel: "info",
      port: 4000,
      wsCorsOrigin: "http://localhost:3000/",
      sessionTtlMinutes: 30,
      hasDatabaseUrl: true,
      hasJwtAccessSecret: false,
      hasJwtRefreshSecret: false,
      authMode: "database"
    });
  });
});
