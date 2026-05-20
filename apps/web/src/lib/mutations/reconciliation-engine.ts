import type {
  CollaborativeMutationEnvelope,
  CollaborativeMutationResultEnvelope,
  MutationLifecycleRealtimePayload,
  RealtimeEventEnvelope
} from "@contriskill/contracts";

import {
  createRealtimeOrderingState,
  shouldApplyRealtimeEvent,
  type RealtimeEventOrderingState
} from "../realtime/event-ordering";

import { type PendingMutationEntry, type PendingMutationQueue } from "./pending-queue";

export type MutationReconciliationDecision =
  | { applied: true; reason: "result_applied" | "duplicate_ignored" | "realtime_applied" }
  | {
      applied: false;
      reason:
        | "mutation_not_found"
        | "terminal_state"
        | "stale_acknowledgement"
        | "stale_realtime_event";
    };

const terminalStates = new Set<PendingMutationEntry["status"]>([
  "acknowledged",
  "rejected",
  "conflicted",
  "rolled_back",
  "failed"
]);

const toResultEnvelopeFromRealtime = (
  payload: MutationLifecycleRealtimePayload
): CollaborativeMutationResultEnvelope => {
  const now = new Date().toISOString();
  if (payload.status === "acknowledged") {
    return {
      version: 1,
      status: "acknowledged",
      mutationId: payload.mutationId,
      targetType: payload.targetType as "contribution.post" | "contribution.application",
      targetId: payload.targetId,
      sequence: payload.sequence ?? 0,
      appliedVersion: payload.appliedVersion ?? 0,
      acknowledgedAt: payload.acknowledgedAt ?? now
    };
  }

  if (payload.status === "rejected") {
    return {
      version: 1,
      status: "rejected",
      mutationId: payload.mutationId,
      code:
        (payload.code as
          | "UNAUTHENTICATED"
          | "FORBIDDEN"
          | "MALFORMED_MUTATION"
          | "DUPLICATE_MUTATION"
          | "REPLAY_REJECTED") ?? "REPLAY_REJECTED",
      message: payload.message ?? "Mutation rejected by realtime lifecycle event.",
      rejectedAt: now
    };
  }

  return {
    version: 1,
    status: "conflict",
    mutationId: payload.mutationId,
    targetType: payload.targetType as "contribution.post" | "contribution.application",
    targetId: payload.targetId,
    code:
      (payload.code as
        | "STALE_BASE"
        | "SAME_FIELD_CONFLICT"
        | "INVALID_STATE"
        | "OWNERSHIP_FORBIDDEN") ?? "INVALID_STATE",
    message: payload.message ?? "Mutation conflicted from realtime lifecycle event.",
    conflictAt: now,
    ...(payload.appliedVersion !== undefined ? { serverVersion: payload.appliedVersion } : {})
  };
};

const isStaleAcknowledgement = (
  existing: PendingMutationEntry,
  incoming: CollaborativeMutationResultEnvelope
): boolean => {
  if (!existing.result) {
    return false;
  }
  if (existing.result.status !== "acknowledged" || incoming.status !== "acknowledged") {
    return false;
  }

  if (incoming.appliedVersion < existing.result.appliedVersion) {
    return true;
  }

  return incoming.sequence < existing.result.sequence;
};

export const createMutationReconciliationEngine = (
  queue: PendingMutationQueue,
  orderingState: RealtimeEventOrderingState = createRealtimeOrderingState()
) => {
  const seenRealtimeLifecycleIds = new Set<string>();

  const applyResult = (
    result: CollaborativeMutationResultEnvelope
  ): MutationReconciliationDecision => {
    const existing = queue.get(result.mutationId);
    if (!existing) {
      return { applied: false, reason: "mutation_not_found" };
    }
    if (terminalStates.has(existing.status)) {
      if (isStaleAcknowledgement(existing, result)) {
        return { applied: false, reason: "stale_acknowledgement" };
      }
      if (existing.result && JSON.stringify(existing.result) === JSON.stringify(result)) {
        return { applied: true, reason: "duplicate_ignored" };
      }
      return { applied: false, reason: "terminal_state" };
    }

    if (isStaleAcknowledgement(existing, result)) {
      return { applied: false, reason: "stale_acknowledgement" };
    }

    queue.applyResult(result);
    return { applied: true, reason: "result_applied" };
  };

  const handleRealtimeLifecycleEvent = (
    event: RealtimeEventEnvelope<MutationLifecycleRealtimePayload>
  ): MutationReconciliationDecision => {
    if (seenRealtimeLifecycleIds.has(event.eventId)) {
      return { applied: true, reason: "duplicate_ignored" };
    }

    const orderingDecision = shouldApplyRealtimeEvent(event, orderingState);
    if (!orderingDecision.apply) {
      return { applied: false, reason: "stale_realtime_event" };
    }

    const result = toResultEnvelopeFromRealtime(event.payload);
    const decision = applyResult(result);
    if (decision.applied) {
      seenRealtimeLifecycleIds.add(event.eventId);
      return { applied: true, reason: "realtime_applied" };
    }
    return decision;
  };

  const enqueueOptimistic = (envelope: CollaborativeMutationEnvelope): PendingMutationEntry => {
    const created = queue.enqueue(envelope);
    return queue.markOptimisticApplied(envelope.mutationId) ?? created;
  };

  const rollbackMutation = (
    mutationId: string,
    reason?: string
  ): PendingMutationEntry | undefined => {
    return queue.markRolledBack(mutationId, reason);
  };

  const markRetrying = (mutationId: string): PendingMutationEntry | undefined => {
    return queue.markRetrying(mutationId);
  };

  return {
    enqueueOptimistic,
    applyResult,
    handleRealtimeLifecycleEvent,
    rollbackMutation,
    markRetrying
  };
};
