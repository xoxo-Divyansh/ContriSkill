import type {
  CollaborativeMutationEnvelope,
  CollaborativeMutationResultEnvelope
} from "@contriskill/contracts";

export type PendingMutationStatus =
  | "pending"
  | "acknowledged"
  | "rejected"
  | "conflict"
  | "retryable_error";

export type PendingMutationEntry = {
  envelope: CollaborativeMutationEnvelope;
  status: PendingMutationStatus;
  attempts: number;
  lastUpdatedAt: string;
  result?: CollaborativeMutationResultEnvelope;
};

export type PendingMutationQueue = {
  enqueue: (envelope: CollaborativeMutationEnvelope) => PendingMutationEntry;
  markRetryableError: (mutationId: string) => PendingMutationEntry | undefined;
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
    markRetryableError: (mutationId) => {
      const existing = entries.get(mutationId);
      if (!existing) {
        return undefined;
      }
      const updated: PendingMutationEntry = {
        ...existing,
        status: "retryable_error",
        attempts: existing.attempts + 1,
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
        status: result.status,
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
