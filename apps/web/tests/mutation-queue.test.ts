import { describe, expect, it } from "vitest";

import {
  createPendingMutationQueue,
  selectReplayablePendingMutations,
  shouldRetryMutation
} from "../src/lib/mutations";

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
  baseVersion: 0
};

describe("pending mutation queue", () => {
  it("enqueues and applies acknowledgement state", () => {
    const queue = createPendingMutationQueue();
    queue.enqueue(envelope);

    const updated = queue.applyResult({
      version: 1,
      status: "acknowledged",
      mutationId: "mut_1",
      targetType: "contribution.post",
      targetId: "post_1",
      sequence: 3,
      appliedVersion: 4,
      acknowledgedAt: new Date().toISOString()
    });

    expect(updated?.status).toBe("acknowledged");
    expect(queue.get("mut_1")?.result?.status).toBe("acknowledged");
  });

  it("tracks retryable state and replay candidates", () => {
    const queue = createPendingMutationQueue();
    queue.enqueue(envelope);
    const retryable = queue.markRetryableError("mut_1");
    expect(retryable?.status).toBe("retryable_error");
    expect(shouldRetryMutation(retryable!)).toBe(true);
    expect(selectReplayablePendingMutations(queue.list())).toHaveLength(1);
  });
});
