import { describe, expect, it } from "vitest";

import { parseApiEnv } from "../src/config/env-schema";

describe("parseApiEnv", () => {
  it("parses API env with safe defaults", () => {
    const env = parseApiEnv({});

    expect(env.nodeEnv).toBe("development");
    expect(env.port).toBe(4000);
    expect(env.wsCorsOrigin).toBe("http://localhost:3000/");
    expect(env.sessionTtlMinutes).toBe(30);
  });

  it("fails fast for invalid port", () => {
    expect(() => parseApiEnv({ API_PORT: "not-a-number" })).toThrow();
  });

  it("requires production secrets in production mode", () => {
    expect(() => parseApiEnv({ NODE_ENV: "production" })).toThrow(
      '[env] Missing required environment variable "DATABASE_URL". Set it in apps/api/.env.local (see apps/api/.env.example).'
    );
  });
});
