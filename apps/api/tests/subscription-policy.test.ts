import { describe, expect, it } from "vitest";

import { authorizeSubscription } from "../src/realtime/subscription-policy";

describe("subscription policy", () => {
  it("allows authenticated actor own actor scope", () => {
    const result = authorizeSubscription(
      {
        actorType: "authenticated",
        role: "user",
        sessionState: "authenticated",
        userId: "usr_1"
      },
      {
        scope: { type: "actor", id: "usr_1" },
        topic: "system.actor"
      }
    );

    expect(result.allowed).toBe(true);
  });

  it("rejects mismatched actor scope", () => {
    const result = authorizeSubscription(
      {
        actorType: "authenticated",
        role: "user",
        sessionState: "authenticated",
        userId: "usr_1"
      },
      {
        scope: { type: "actor", id: "usr_2" },
        topic: "system.actor"
      }
    );

    expect(result.allowed).toBe(false);
  });
});
