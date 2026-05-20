import { describe, expect, it } from "vitest";

import { createDraftSyncStore } from "../src/lib/drafts";

const baseSnapshot = {
  version: 1 as const,
  draftId: "draft:contribution:post_1",
  targetType: "contribution.post" as const,
  targetId: "post_1",
  actorId: "usr_1",
  clientId: "web-client",
  draftVersion: 1,
  fields: {
    note: "Initial"
  },
  timestamp: new Date().toISOString()
};

const basePatch = {
  version: 1 as const,
  patchId: "dpt_1",
  draftId: "draft:contribution:post_1",
  targetType: "contribution.post" as const,
  targetId: "post_1",
  actorId: "usr_1",
  clientId: "web-client",
  draftVersion: 1,
  baseVersion: 1,
  patch: {
    note: "Optimistic note"
  },
  timestamp: new Date().toISOString()
};

describe("draft synchronization store", () => {
  it("supports optimistic projection and acknowledgement reconciliation", () => {
    const store = createDraftSyncStore();
    store.hydrateRemoteSnapshot(baseSnapshot);
    store.enqueueOptimisticPatch(basePatch);

    expect(store.getState().localDraft?.fields.note).toBe("Optimistic note");

    store.applyPatchResult({
      version: 1,
      status: "acknowledged",
      patchId: "dpt_1",
      draftId: "draft:contribution:post_1",
      targetType: "contribution.post",
      targetId: "post_1",
      appliedDraftVersion: 2,
      acknowledgedAt: new Date().toISOString()
    });

    expect(store.getState().pendingPatches[0]?.status).toBe("acknowledged");
    expect(store.getState().remoteDraft?.draftVersion).toBe(2);
  });

  it("supports retrying and rollback transitions", () => {
    const store = createDraftSyncStore();
    store.hydrateRemoteSnapshot(baseSnapshot);
    store.enqueueOptimisticPatch(basePatch);
    store.markPatchRetrying("dpt_1");
    expect(store.getState().pendingPatches[0]?.status).toBe("retrying");
    store.rollbackPatch("dpt_1", "network-failure");
    expect(store.getState().pendingPatches[0]?.status).toBe("rolled_back");
  });
});
