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

  it("returns conflict when registering duplicate identity", async () => {
    const app = createServer(getApiEnv());
    const payload = {
      email: "duplicate@example.com",
      username: "duplicateUser",
      password: "StrongPassword123!"
    };

    const firstResponse = await request(app).post("/api/v1/auth/register").send(payload);
    const secondResponse = await request(app).post("/api/v1/auth/register").send(payload);

    expect(firstResponse.status).toBe(202);
    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body?.error?.code).toBe("STATE_CONFLICT");
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

  it("resolves actor from issued session token", async () => {
    const app = createServer(getApiEnv());

    await request(app).post("/api/v1/auth/register").send({
      email: "identity@example.com",
      username: "identityUser",
      password: "StrongPassword123!"
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      identifier: "identity@example.com",
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

  it("rotates session tokens on refresh", async () => {
    const app = createServer(getApiEnv());

    await request(app).post("/api/v1/auth/register").send({
      email: "rotate@example.com",
      username: "rotateUser",
      password: "StrongPassword123!"
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      identifier: "rotate@example.com",
      password: "StrongPassword123!"
    });

    const accessToken: string | undefined = loginResponse.body?.data?.session?.accessToken;
    const refreshToken: string | undefined = loginResponse.body?.data?.session?.refreshToken;

    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("x-session-token", accessToken ?? "")
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(202);
    expect(refreshResponse.body?.data?.session?.accessTokenIssued).toBe(true);
    expect(refreshResponse.body?.data?.session?.refreshTokenIssued).toBe(true);
    expect(refreshResponse.body?.data?.session?.accessToken).not.toBe(accessToken);
    expect(refreshResponse.body?.data?.session?.refreshToken).not.toBe(refreshToken);
  });

  it("revokes active session on logout", async () => {
    const app = createServer(getApiEnv());

    await request(app).post("/api/v1/auth/register").send({
      email: "logout@example.com",
      username: "logoutUser",
      password: "StrongPassword123!"
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      identifier: "logout@example.com",
      password: "StrongPassword123!"
    });

    const accessToken: string | undefined = loginResponse.body?.data?.session?.accessToken;

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("x-session-token", accessToken ?? "")
      .send({});

    const meResponseAfterLogout = await request(app)
      .get("/api/v1/auth/me")
      .set("x-session-token", accessToken ?? "");

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body?.data?.revoked).toBe(true);
    expect(meResponseAfterLogout.status).toBe(401);
  });

  it("rejects login with invalid password for persisted identity", async () => {
    const app = createServer(getApiEnv());

    await request(app).post("/api/v1/auth/register").send({
      email: "invalid-pass@example.com",
      username: "invalidPassUser",
      password: "StrongPassword123!"
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      identifier: "invalid-pass@example.com",
      password: "WrongPassword123!"
    });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body?.error?.code).toBe("UNAUTHENTICATED");
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
