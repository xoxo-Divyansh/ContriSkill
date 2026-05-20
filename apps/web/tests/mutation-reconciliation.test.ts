import { realtimeEventNames, realtimeEventVersion } from "@contriskill/contracts";
import { describe, expect, it } from "vitest";

import { createPendingMutationQueue } from "../src/lib/mutations/pending-queue";
import { createMutationReconciliationEngine } from "../src/lib/mutations/reconciliation-engine";

const envelope = {
  version: 1 as const,
  mutationId: "mut_1",
  clientId: "cli_1",
  actorId: "usr_1",
  targetType: "contribution.post" as const,
  targetId: "post_1",
  mutationType: "contribution.post.update.v1" as const,
  payload: { title: "updated" },
  timestamp: new Date().toISOString(),
  baseVersion: 1
};

describe("mutation optimistic reconciliation", () => {
  it("applies optimistic lifecycle then converges on acknowledgement", () => {
    const queue = createPendingMutationQueue();
    const engine = createMutationReconciliationEngine(queue);
    engine.enqueueOptimistic(envelope);

    expect(queue.get("mut_1")?.status).toBe("optimistic_applied");

    const decision = engine.applyResult({
      version: 1,
      status: "acknowledged",
      mutationId: "mut_1",
      targetType: "contribution.post",
      targetId: "post_1",
      sequence: 5,
      appliedVersion: 3,
      acknowledgedAt: new Date().toISOString()
    });

    expect(decision.applied).toBe(true);
    expect(queue.get("mut_1")?.status).toBe("acknowledged");
  });

  it("supports rollback and retry transitions", () => {
    const queue = createPendingMutationQueue();
    const engine = createMutationReconciliationEngine(queue);
    engine.enqueueOptimistic(envelope);

    engine.markRetrying("mut_1");
    expect(queue.get("mut_1")?.status).toBe("retrying");

    engine.rollbackMutation("mut_1", "conflict-recovery");
    expect(queue.get("mut_1")?.status).toBe("rolled_back");
  });

  it("applies conflict reconciliation deterministically", () => {
    const queue = createPendingMutationQueue();
    const engine = createMutationReconciliationEngine(queue);
    engine.enqueueOptimistic(envelope);

    const decision = engine.applyResult({
      version: 1,
      status: "conflict",
      mutationId: "mut_1",
      targetType: "contribution.post",
      targetId: "post_1",
      code: "STALE_BASE",
      message: "stale",
      conflictAt: new Date().toISOString(),
      conflictDetails: { baseVersion: 1, serverVersion: 2 },
      serverVersion: 2
    });

    expect(decision.applied).toBe(true);
    expect(queue.get("mut_1")?.status).toBe("conflicted");
  });

  it("ignores duplicate realtime mutation lifecycle events", () => {
    const queue = createPendingMutationQueue();
    const engine = createMutationReconciliationEngine(queue);
    engine.enqueueOptimistic(envelope);

    const realtimeEvent = {
      eventId: "evt_mutation_1",
      eventName: realtimeEventNames.mutationAcknowledged,
      version: realtimeEventVersion,
      occurredAt: new Date().toISOString(),
      scope: { type: "contribution", id: "post_1" } as const,
      sequence: 7,
      payload: {
        mutationId: "mut_1",
        targetType: "contribution.post",
        targetId: "post_1",
        status: "acknowledged" as const,
        sequence: 7,
        appliedVersion: 2
      }
    };

    const first = engine.handleRealtimeLifecycleEvent(realtimeEvent);
    const second = engine.handleRealtimeLifecycleEvent(realtimeEvent);

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(true);
    if (second.applied) {
      expect(second.reason).toBe("duplicate_ignored");
    }
  });

  it("rejects stale acknowledgement versions", () => {
    const queue = createPendingMutationQueue();
    const engine = createMutationReconciliationEngine(queue);
    engine.enqueueOptimistic(envelope);
    engine.applyResult({
      version: 1,
      status: "acknowledged",
      mutationId: "mut_1",
      targetType: "contribution.post",
      targetId: "post_1",
      sequence: 10,
      appliedVersion: 8,
      acknowledgedAt: new Date().toISOString()
    });

    const stale = engine.applyResult({
      version: 1,
      status: "acknowledged",
      mutationId: "mut_1",
      targetType: "contribution.post",
      targetId: "post_1",
      sequence: 9,
      appliedVersion: 7,
      acknowledgedAt: new Date().toISOString()
    });

    expect(stale.applied).toBe(false);
    expect(stale.reason).toBe("stale_acknowledgement");
  });
});
