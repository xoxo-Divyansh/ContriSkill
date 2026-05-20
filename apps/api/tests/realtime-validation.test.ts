import { realtimeEventNames, realtimeEventVersion } from "@contriskill/contracts";
import { describe, expect, it } from "vitest";

import { validateIncomingEnvelope } from "../src/realtime/validation";

describe("realtime envelope validation", () => {
  it("accepts valid client subscribe envelope", () => {
    const result = validateIncomingEnvelope({
      eventId: "evt_1",
      eventName: realtimeEventNames.clientSubscribe,
      version: realtimeEventVersion,
      occurredAt: new Date().toISOString(),
      scope: { type: "actor", id: "usr_1" },
      payload: {
        subscription: {
          scope: { type: "actor", id: "usr_1" },
          topic: "system.actor"
        }
      }
    });
    expect(result.ok).toBe(true);
  });

  it("rejects malformed envelope and unsupported version", () => {
    const malformed = validateIncomingEnvelope({
      eventId: "evt_2",
      eventName: realtimeEventNames.clientSubscribe,
      version: 2,
      occurredAt: "invalid-date",
      scope: { type: "actor", id: "" },
      payload: {}
    });
    expect(malformed.ok).toBe(false);
  });
});
