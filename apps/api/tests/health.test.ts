import request from "supertest";
import { describe, expect, it } from "vitest";

import { getApiEnv } from "../src/config/env";
import { createServer } from "../src/server";

describe("health endpoint", () => {
  it("returns service status", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body?.data?.status).toBe("ok");
  });
});
