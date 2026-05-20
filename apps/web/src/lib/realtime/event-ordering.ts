import type { RealtimeEventEnvelope } from "@contriskill/contracts";

const staleEventThresholdMs = 10 * 60 * 1000;

export type RealtimeEventOrderingState = {
  lastSequenceByTopic: Map<string, number>;
  lastOccurredAtByTopic: Map<string, number>;
};

export type RealtimeOrderingDecision =
  | { apply: true }
  | { apply: false; reason: "stale_event" | "out_of_order_sequence" | "stale_timestamp" };

export const createRealtimeOrderingState = (): RealtimeEventOrderingState => {
  return {
    lastSequenceByTopic: new Map<string, number>(),
    lastOccurredAtByTopic: new Map<string, number>()
  };
};

export const resolveEventTopicHint = (
  event: RealtimeEventEnvelope<unknown>
): string | undefined => {
  if (event.scope.type !== "contribution") {
    return undefined;
  }
  return event.scope.id === "list" ? "contribution:list" : `contribution:${event.scope.id}`;
};

export const shouldApplyRealtimeEvent = (
  event: RealtimeEventEnvelope<unknown>,
  state: RealtimeEventOrderingState
): RealtimeOrderingDecision => {
  const topicHint = resolveEventTopicHint(event);
  if (!topicHint) {
    return { apply: true };
  }

  const now = Date.now();
  const occurredAt = Date.parse(event.occurredAt);
  if (Number.isFinite(occurredAt) && now - occurredAt > staleEventThresholdMs) {
    return { apply: false, reason: "stale_event" };
  }

  if (typeof event.sequence === "number") {
    const lastSequence = state.lastSequenceByTopic.get(topicHint) ?? 0;
    if (event.sequence <= lastSequence) {
      return { apply: false, reason: "out_of_order_sequence" };
    }
    state.lastSequenceByTopic.set(topicHint, event.sequence);
    if (Number.isFinite(occurredAt)) {
      state.lastOccurredAtByTopic.set(topicHint, occurredAt);
    }
    return { apply: true };
  }

  if (Number.isFinite(occurredAt)) {
    const lastOccurredAt = state.lastOccurredAtByTopic.get(topicHint) ?? 0;
    if (occurredAt < lastOccurredAt) {
      return { apply: false, reason: "stale_timestamp" };
    }
    state.lastOccurredAtByTopic.set(topicHint, occurredAt);
  }

  return { apply: true };
};
