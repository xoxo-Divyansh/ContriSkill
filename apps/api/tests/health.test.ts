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

  it("allows local browser origins for frontend to API connectivity", async () => {
    const app = createServer(getApiEnv());

    const localhostResponse = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:3000");
    expect(localhostResponse.headers["access-control-allow-origin"]).toBe("http://localhost:3000");

    const loopbackResponse = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://127.0.0.1:3000");
    expect(loopbackResponse.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3000");
  });
});
