import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { getApiEnv } from "../src/config/env";
import { resetRateLimitStateForTests } from "../src/middleware/rate-limit";
import { requestActorHeaderKeys } from "../src/modules/auth/types";
import { createServer } from "../src/server";

const authHeaders = {
  [requestActorHeaderKeys.actorType]: "authenticated",
  [requestActorHeaderKeys.sessionState]: "authenticated",
  [requestActorHeaderKeys.role]: "user",
  [requestActorHeaderKeys.userId]: "usr_test"
};

describe("security hardening", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
  });

  it("normalizes malformed json request payload errors", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("content-type", "application/json")
      .send("{ malformed");

    expect(response.status).toBe(400);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("rejects unknown fields in auth and contribution payloads", async () => {
    const app = createServer(getApiEnv());

    const authResponse = await request(app).post("/api/v1/auth/login").send({
      identifier: "user@example.com",
      password: "StrongPassword123!",
      unsafe: true
    });
    const contributionResponse = await request(app).post("/api/v1/posts").set(authHeaders).send({
      type: "mentorship",
      title: "Need review",
      description: "Review auth architecture",
      difficulty: "medium",
      creditOffer: 50,
      unknownField: "x"
    });

    expect(authResponse.status).toBe(400);
    expect(authResponse.body?.error?.code).toBe("VALIDATION_ERROR");
    expect(contributionResponse.status).toBe(422);
    expect(contributionResponse.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("rate limits auth-sensitive endpoints with consistent envelope", async () => {
    const app = createServer(getApiEnv());

    const responses = await Promise.all(
      Array.from({ length: 31 }).map(() =>
        request(app).post("/api/v1/auth/login").send({
          identifier: "nobody@example.com",
          password: "wrong-password"
        })
      )
    );

    const throttled = responses.find((response) => response.status === 429);
    expect(throttled).toBeDefined();
    expect(throttled?.body?.error?.code).toBe("RATE_LIMITED");
  });

  it("uses normalized unauthorized response for capability/auth failures", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app).get("/api/v1/posts");

    expect(response.status).toBe(401);
    expect(response.body?.error?.code).toBe("UNAUTHENTICATED");
  });
});
