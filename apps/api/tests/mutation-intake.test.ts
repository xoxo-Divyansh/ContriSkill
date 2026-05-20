import request from "supertest";
import { describe, expect, it } from "vitest";

import { getApiEnv } from "../src/config/env";
import { requestActorHeaderKeys } from "../src/modules/auth/types";
import { createServer } from "../src/server";

const actorHeaders = {
  [requestActorHeaderKeys.actorType]: "authenticated",
  [requestActorHeaderKeys.sessionState]: "authenticated",
  [requestActorHeaderKeys.role]: "user",
  [requestActorHeaderKeys.userId]: "usr_requester"
};

const baseEnvelope = {
  version: 1 as const,
  mutationId: "mut_1",
  clientId: "cli_web_1",
  actorId: "usr_requester",
  targetType: "contribution.post" as const,
  targetId: "post_1",
  mutationType: "contribution.post.update.v1" as const,
  payload: {
    title: "Updated title"
  },
  timestamp: new Date().toISOString(),
  baseVersion: 0
};

describe("mutation intake boundary", () => {
  it("acknowledges valid mutation envelopes", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/mutations")
      .set(actorHeaders)
      .send(baseEnvelope);

    expect(response.status).toBe(202);
    expect(response.body?.data?.result?.status).toBe("acknowledged");
    expect(response.body?.data?.result?.sequence).toBe(1);
    expect(response.body?.data?.result?.appliedVersion).toBe(1);
  });

  it("returns deterministic idempotency response for duplicate mutation", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/mutations").set(actorHeaders).send(baseEnvelope);

    const duplicate = await request(app)
      .post("/api/v1/mutations")
      .set(actorHeaders)
      .send(baseEnvelope);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body?.data?.result?.status).toBe("acknowledged");
    expect(duplicate.body?.data?.result?.sequence).toBe(1);
  });

  it("rejects malformed mutation envelopes", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/mutations")
      .set(actorHeaders)
      .send({
        ...baseEnvelope,
        mutationType: "invalid.type.v1"
      });

    expect(response.status).toBe(422);
    expect(response.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("rejects stale-base mutations", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/mutations").set(actorHeaders).send(baseEnvelope);

    const staleResponse = await request(app)
      .post("/api/v1/mutations")
      .set(actorHeaders)
      .send({
        ...baseEnvelope,
        mutationId: "mut_2",
        baseVersion: 0
      });

    expect(staleResponse.status).toBe(409);
    expect(staleResponse.body?.data?.result?.status).toBe("conflict");
    expect(staleResponse.body?.data?.result?.code).toBe("STALE_BASE");
  });

  it("rejects actor mismatch for mutation ownership safety", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/mutations")
      .set(actorHeaders)
      .send({
        ...baseEnvelope,
        mutationId: "mut_3",
        actorId: "usr_other"
      });

    expect(response.status).toBe(403);
    expect(response.body?.data?.result?.status).toBe("rejected");
    expect(response.body?.data?.result?.code).toBe("FORBIDDEN");
  });
});
