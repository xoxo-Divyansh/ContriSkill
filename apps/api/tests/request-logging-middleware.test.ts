import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { getApiEnv } from "../src/config/env";
import { createServer } from "../src/server";

describe("request logging middleware", () => {
  it("logs request start and completion", async () => {
    const app = createServer(getApiEnv());
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    await request(app).get("/api/v1/unknown-route");

    const entries = spy.mock.calls
      .map((call) => JSON.parse(String(call[0])) as { message: string; level: string })
      .filter((entry) => entry.message.startsWith("HTTP request"));

    expect(entries.some((entry) => entry.message === "HTTP request started.")).toBe(true);
    expect(
      entries.some((entry) => entry.message === "HTTP request completed with client error.")
    ).toBe(true);
    spy.mockRestore();
  });
});
