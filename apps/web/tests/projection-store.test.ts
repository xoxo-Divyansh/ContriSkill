import { describe, expect, it } from "vitest";

import { createProjectionSyncStore } from "../src/lib/projections";

const baseSnapshot = {
  version: 1 as const,
  projectionId: "projection:contribution:post_1",
  workspaceId: "workspace:post_1",
  targetType: "contribution.workspace" as const,
  targetId: "post_1",
  actorId: "usr_1",
  clientId: "web-client",
  projectionVersion: 1,
  fields: {
    note: "Initial projection"
  },
  timestamp: new Date().toISOString()
};

const baseUpdate = {
  version: 1 as const,
  updateId: "upd_1",
  projectionId: "projection:contribution:post_1",
  workspaceId: "workspace:post_1",
  targetType: "contribution.workspace" as const,
  targetId: "post_1",
  actorId: "usr_1",
  clientId: "web-client",
  projectionVersion: 1,
  baseDraftVersion: 1,
  patch: {
    note: "Optimistic projection"
  },
  timestamp: new Date().toISOString()
};

describe("projection synchronization store", () => {
  it("supports optimistic projection and acknowledgement reconciliation", () => {
    const store = createProjectionSyncStore();
    store.hydrateRemoteSnapshot(baseSnapshot);
    store.enqueueOptimisticUpdate(baseUpdate);

    expect(store.getState().localProjection?.fields.note).toBe("Optimistic projection");

    store.applyUpdateResult({
      version: 1,
      status: "acknowledged",
      updateId: "upd_1",
      projectionId: "projection:contribution:post_1",
      workspaceId: "workspace:post_1",
      targetType: "contribution.workspace",
      targetId: "post_1",
      appliedProjectionVersion: 2,
      acknowledgedAt: new Date().toISOString()
    });

    expect(store.getState().pendingUpdates[0]?.status).toBe("acknowledged");
    expect(store.getState().remoteProjection?.projectionVersion).toBe(2);
  });

  it("supports retrying and rollback transitions", () => {
    const store = createProjectionSyncStore();
    store.hydrateRemoteSnapshot(baseSnapshot);
    store.enqueueOptimisticUpdate(baseUpdate);
    store.markUpdateRetrying("upd_1");
    expect(store.getState().pendingUpdates[0]?.status).toBe("retrying");
    store.rollbackUpdate("upd_1", "network-failure");
    expect(store.getState().pendingUpdates[0]?.status).toBe("rolled_back");
  });
});
