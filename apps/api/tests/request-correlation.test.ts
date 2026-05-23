import request from "supertest";
import { describe, expect, it } from "vitest";

import { getApiEnv } from "../src/config/env";
import { createServer } from "../src/server";
import { requestIdHeaderName } from "../src/middleware/request-correlation";

describe("request correlation middleware", () => {
  it("generates a request id when missing", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).get("/api/v1/health");

    expect(response.headers[requestIdHeaderName]).toBeTypeOf("string");
    expect(String(response.headers[requestIdHeaderName]).length).toBeGreaterThan(10);
  });

  it("preserves caller request id header when valid", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .get("/api/v1/health")
      .set(requestIdHeaderName, "caller_req_123");

    expect(response.headers[requestIdHeaderName]).toBe("caller_req_123");
  });
});
