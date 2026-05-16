import request from "supertest";
import { describe, expect, it } from "vitest";

import type { ApiEnv } from "../src/config/env";
import {
  createPostgresClient,
  PersistenceRuntimeError,
  type DatabaseClient
} from "../src/db/postgres";
import { createAuthSessionRuntime } from "../src/modules/auth/session";
import { createServer } from "../src/server";

const baseEnv: ApiEnv = {
  nodeEnv: "test",
  logLevel: "info",
  port: 4000,
  wsCorsOrigin: "http://localhost:3000",
  sessionTtlMinutes: 30
};

class ThrowingDatabaseClient implements DatabaseClient {
  constructor(private readonly error: PersistenceRuntimeError) {}

  async query<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<{
    rows: T[];
  }> {
    throw this.error;
  }
}

describe("auth runtime hardening", () => {
  it("falls back to memory mode when DATABASE_URL is invalid", () => {
    const client = createPostgresClient({
      ...baseEnv,
      databaseUrl: "not-a-valid-url"
    } as ApiEnv);

    expect(client).toBeUndefined();
  });

  it("keeps health route stable during auth persistence failure", async () => {
    const app = createServer(baseEnv, {
      databaseClientOverride: new ThrowingDatabaseClient(
        new PersistenceRuntimeError("DB_CONNECTION_FAILED", "connection failed")
      )
    });

    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body?.data?.status).toBe("ok");
  });

  it("falls back from missing auth_sessions table to in-memory session flow", async () => {
    const app = createServer(baseEnv, {
      databaseClientOverride: new ThrowingDatabaseClient(
        new PersistenceRuntimeError("MISSING_AUTH_SESSIONS_TABLE", "missing table")
      )
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      identifier: "user@example.com",
      password: "StrongPassword123!"
    });

    const accessToken: string | undefined = loginResponse.body?.data?.session?.accessToken;
    const meResponse = await request(app)
      .get("/api/v1/auth/me")
      .set("x-session-token", accessToken ?? "");

    expect(loginResponse.status).toBe(202);
    expect(accessToken).toBeDefined();
    expect(meResponse.status).toBe(200);
    expect(meResponse.body?.data?.actor?.actorType).toBe("authenticated");
  });

  it("runtime exposes memory mode when DB client is absent", () => {
    const runtime = createAuthSessionRuntime(baseEnv, {});

    expect(runtime.mode).toBe("memory");
  });
});
