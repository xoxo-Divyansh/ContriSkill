import type { PendingMutationEntry } from "./pending-queue";

export const selectReplayablePendingMutations = (
  entries: PendingMutationEntry[]
): PendingMutationEntry[] => {
  return entries.filter((entry) => {
    return (
      entry.status === "pending" ||
      entry.status === "optimistic_applied" ||
      entry.status === "retrying"
    );
  });
};

export const shouldRetryMutation = (entry: PendingMutationEntry, maxAttempts = 3): boolean => {
  if (entry.status !== "retrying") {
    return false;
  }
  return entry.attempts < maxAttempts;
};
