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

const baseUpdateEnvelope = {
  version: 1 as const,
  updateId: "upd_1",
  projectionId: "projection:contribution:post_1",
  workspaceId: "workspace:post_1",
  targetType: "contribution.workspace" as const,
  targetId: "post_1",
  actorId: "usr_requester",
  clientId: "web-client",
  projectionVersion: 0,
  baseDraftVersion: 0,
  patch: {
    note: "Shared workspace projection"
  },
  timestamp: new Date().toISOString()
};

describe("projection synchronization boundary", () => {
  it("accepts valid projection updates and returns acknowledgement", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/projections/sync")
      .set(actorHeaders)
      .send(baseUpdateEnvelope);

    expect(response.status).toBe(202);
    expect(response.body?.data?.result?.status).toBe("acknowledged");
    expect(response.body?.data?.result?.appliedProjectionVersion).toBe(1);
  });

  it("returns deterministic idempotency result for duplicate update id", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/projections/sync").set(actorHeaders).send(baseUpdateEnvelope);

    const duplicate = await request(app)
      .post("/api/v1/projections/sync")
      .set(actorHeaders)
      .send(baseUpdateEnvelope);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body?.data?.result?.status).toBe("acknowledged");
    expect(duplicate.body?.data?.result?.appliedProjectionVersion).toBe(1);
  });

  it("returns stale-base conflict for old baseDraftVersion", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/projections/sync").set(actorHeaders).send(baseUpdateEnvelope);

    const stale = await request(app)
      .post("/api/v1/projections/sync")
      .set(actorHeaders)
      .send({
        ...baseUpdateEnvelope,
        updateId: "upd_2",
        baseDraftVersion: 0
      });

    expect(stale.status).toBe(409);
    expect(stale.body?.data?.result?.status).toBe("conflict");
    expect(stale.body?.data?.result?.code).toBe("STALE_BASE");
    expect(stale.body?.data?.result?.conflictDetails?.serverProjectionVersion).toBe(1);
  });

  it("retrieves stored projection snapshot after sync", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/projections/sync").set(actorHeaders).send(baseUpdateEnvelope);

    const snapshot = await request(app)
      .get("/api/v1/projections/projection:contribution:post_1")
      .set(actorHeaders);

    expect(snapshot.status).toBe(200);
    expect(snapshot.body?.data?.snapshot?.fields?.note).toBe("Shared workspace projection");
    expect(snapshot.body?.data?.snapshot?.projectionVersion).toBe(1);
  });
});
