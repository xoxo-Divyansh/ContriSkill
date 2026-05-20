import { describe, expect, it } from "vitest";

import {
  createRealtimeOrderingState,
  shouldApplyRealtimeEvent
} from "../src/lib/realtime/event-ordering";

describe("realtime event ordering helpers", () => {
  it("accepts monotonic sequence and rejects out-of-order sequence", () => {
    const state = createRealtimeOrderingState();
    const base = {
      version: 1 as const,
      eventName: "contribution.post.updated.v1" as const,
      scope: { type: "contribution" as const, id: "post_1" },
      payload: { postId: "post_1" }
    };

    expect(
      shouldApplyRealtimeEvent(
        {
          ...base,
          eventId: "evt_1",
          sequence: 1,
          occurredAt: new Date().toISOString()
        },
        state
      )
    ).toEqual({ apply: true });

    expect(
      shouldApplyRealtimeEvent(
        {
          ...base,
          eventId: "evt_2",
          sequence: 1,
          occurredAt: new Date().toISOString()
        },
        state
      )
    ).toEqual({ apply: false, reason: "out_of_order_sequence" });
  });
});
