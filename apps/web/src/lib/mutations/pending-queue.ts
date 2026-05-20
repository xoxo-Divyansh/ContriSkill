import type {
  CollaborativeMutationEnvelope,
  CollaborativeMutationResultEnvelope
} from "@contriskill/contracts";

export type PendingMutationStatus =
  | "pending"
  | "optimistic_applied"
  | "acknowledged"
  | "rejected"
  | "conflicted"
  | "rolled_back"
  | "retrying"
  | "failed";

export type PendingMutationEntry = {
  envelope: CollaborativeMutationEnvelope;
  status: PendingMutationStatus;
  attempts: number;
  lastUpdatedAt: string;
  optimisticAppliedAt?: string;
  rolledBackAt?: string;
  rollbackReason?: string;
  result?: CollaborativeMutationResultEnvelope;
};

export type PendingMutationQueue = {
  enqueue: (envelope: CollaborativeMutationEnvelope) => PendingMutationEntry;
  markOptimisticApplied: (mutationId: string) => PendingMutationEntry | undefined;
  markRetrying: (mutationId: string) => PendingMutationEntry | undefined;
  markFailed: (mutationId: string, reason?: string) => PendingMutationEntry | undefined;
  markRolledBack: (mutationId: string, reason?: string) => PendingMutationEntry | undefined;
  applyResult: (result: CollaborativeMutationResultEnvelope) => PendingMutationEntry | undefined;
  remove: (mutationId: string) => boolean;
  get: (mutationId: string) => PendingMutationEntry | undefined;
  list: () => PendingMutationEntry[];
};

const nowIso = (): string => new Date().toISOString();

export const createPendingMutationQueue = (): PendingMutationQueue => {
  const entries = new Map<string, PendingMutationEntry>();

  return {
    enqueue: (envelope) => {
      const existing = entries.get(envelope.mutationId);
      if (existing) {
        return existing;
      }

      const created: PendingMutationEntry = {
        envelope,
        status: "pending",
        attempts: 1,
        lastUpdatedAt: nowIso()
      };
      entries.set(envelope.mutationId, created);
      return created;
    },
    markOptimisticApplied: (mutationId) => {
      const existing = entries.get(mutationId);
      if (!existing) {
        return undefined;
      }
      const updated: PendingMutationEntry = {
        ...existing,
        status: "optimistic_applied",
        optimisticAppliedAt: nowIso(),
        lastUpdatedAt: nowIso()
      };
      entries.set(mutationId, updated);
      return updated;
    },
    markRetrying: (mutationId) => {
      const existing = entries.get(mutationId);
      if (!existing) {
        return undefined;
      }
      const updated: PendingMutationEntry = {
        ...existing,
        status: "retrying",
        attempts: existing.attempts + 1,
        lastUpdatedAt: nowIso()
      };
      entries.set(mutationId, updated);
      return updated;
    },
    markFailed: (mutationId, reason) => {
      const existing = entries.get(mutationId);
      if (!existing) {
        return undefined;
      }
      const updated: PendingMutationEntry = {
        ...existing,
        status: "failed",
        ...(reason ? { rollbackReason: reason } : {}),
        lastUpdatedAt: nowIso()
      };
      entries.set(mutationId, updated);
      return updated;
    },
    markRolledBack: (mutationId, reason) => {
      const existing = entries.get(mutationId);
      if (!existing) {
        return undefined;
      }
      const updated: PendingMutationEntry = {
        ...existing,
        status: "rolled_back",
        rolledBackAt: nowIso(),
        ...(reason ? { rollbackReason: reason } : {}),
        lastUpdatedAt: nowIso()
      };
      entries.set(mutationId, updated);
      return updated;
    },
    applyResult: (result) => {
      const existing = entries.get(result.mutationId);
      if (!existing) {
        return undefined;
      }
      const updated: PendingMutationEntry = {
        ...existing,
        status: result.status === "conflict" ? "conflicted" : result.status,
        result,
        lastUpdatedAt: nowIso()
      };
      entries.set(result.mutationId, updated);
      return updated;
    },
    remove: (mutationId) => {
      return entries.delete(mutationId);
    },
    get: (mutationId) => entries.get(mutationId),
    list: () => [...entries.values()]
  };
};
