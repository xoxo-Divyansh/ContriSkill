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

const basePatchEnvelope = {
  version: 1 as const,
  patchId: "dpt_1",
  draftId: "draft:contribution:post_1",
  targetType: "contribution.post" as const,
  targetId: "post_1",
  actorId: "usr_requester",
  clientId: "web-client",
  draftVersion: 0,
  baseVersion: 0,
  patch: {
    note: "First draft note"
  },
  timestamp: new Date().toISOString()
};

describe("draft synchronization boundary", () => {
  it("accepts valid draft patch and returns acknowledgement", async () => {
    const app = createServer(getApiEnv());
    const response = await request(app)
      .post("/api/v1/drafts/sync")
      .set(actorHeaders)
      .send(basePatchEnvelope);

    expect(response.status).toBe(202);
    expect(response.body?.data?.result?.status).toBe("acknowledged");
    expect(response.body?.data?.result?.appliedDraftVersion).toBe(1);
  });

  it("returns deterministic idempotency result for duplicate patch id", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/drafts/sync").set(actorHeaders).send(basePatchEnvelope);
    const duplicate = await request(app)
      .post("/api/v1/drafts/sync")
      .set(actorHeaders)
      .send(basePatchEnvelope);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body?.data?.result?.status).toBe("acknowledged");
    expect(duplicate.body?.data?.result?.appliedDraftVersion).toBe(1);
  });

  it("returns stale-base conflict for old baseVersion", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/drafts/sync").set(actorHeaders).send(basePatchEnvelope);

    const stale = await request(app)
      .post("/api/v1/drafts/sync")
      .set(actorHeaders)
      .send({
        ...basePatchEnvelope,
        patchId: "dpt_2",
        baseVersion: 0
      });

    expect(stale.status).toBe(409);
    expect(stale.body?.data?.result?.status).toBe("conflict");
    expect(stale.body?.data?.result?.code).toBe("STALE_BASE");
    expect(stale.body?.data?.result?.conflictDetails?.serverVersion).toBe(1);
  });

  it("retrieves stored draft snapshot after sync", async () => {
    const app = createServer(getApiEnv());
    await request(app).post("/api/v1/drafts/sync").set(actorHeaders).send(basePatchEnvelope);

    const snapshot = await request(app)
      .get("/api/v1/drafts/draft:contribution:post_1")
      .set(actorHeaders);

    expect(snapshot.status).toBe(200);
    expect(snapshot.body?.data?.snapshot?.fields?.note).toBe("First draft note");
    expect(snapshot.body?.data?.snapshot?.draftVersion).toBe(1);
  });
});
