import request from "supertest";
import { describe, expect, it } from "vitest";

import { getApiEnv } from "../src/config/env";
import { requestActorHeaderKeys } from "../src/modules/auth/types";
import { createServer } from "../src/server";

const authHeaders = {
  [requestActorHeaderKeys.actorType]: "authenticated",
  [requestActorHeaderKeys.sessionState]: "authenticated",
  [requestActorHeaderKeys.role]: "user",
  [requestActorHeaderKeys.userId]: "usr_test_1"
};

describe("auth routes", () => {
  it("returns placeholder register response for valid payload", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "user@example.com",
      username: "contributor01",
      password: "StrongPassword123!"
    });

    expect(response.status).toBe(202);
    expect(response.body?.data?.status).toBe("OPEN_DECISION_IMPLEMENTATION_PENDING");
    expect(response.body?.data?.user?.email).toBe("user@example.com");
  });

  it("returns validation error for incomplete register payload", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "user@example.com"
    });

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("blocks protected session endpoint when actor is anonymous", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body?.error?.code).toBe("UNAUTHENTICATED");
  });

  it("returns actor snapshot for authenticated session endpoint", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).get("/api/v1/auth/me").set(authHeaders);

    expect(response.status).toBe(200);
    expect(response.body?.data?.actor?.userId).toBe("usr_test_1");
    expect(response.body?.data?.actor?.role).toBe("user");
  });

  it("enforces role policy for protected auth routes", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set({
        [requestActorHeaderKeys.actorType]: "authenticated",
        [requestActorHeaderKeys.sessionState]: "authenticated",
        [requestActorHeaderKeys.role]: "public",
        [requestActorHeaderKeys.userId]: "usr_test_2"
      })
      .send({});

    expect(response.status).toBe(403);
    expect(response.body?.error?.code).toBe("FORBIDDEN");
  });
});
