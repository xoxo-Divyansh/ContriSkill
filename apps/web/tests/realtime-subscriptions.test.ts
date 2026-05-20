import { describe, expect, it } from "vitest";

import {
  actorSystemSubscription,
  contributionLifecycleSubscription,
  contributionRoomSubscription
} from "../src/lib/realtime/subscriptions";

describe("realtime subscription helpers", () => {
  it("creates typed actor and contribution subscriptions", () => {
    expect(actorSystemSubscription("usr_1")).toEqual({
      scope: { type: "actor", id: "usr_1" },
      topic: "system.actor"
    });
    expect(contributionLifecycleSubscription("post_1").topic).toBe("contribution.lifecycle");
    expect(contributionRoomSubscription("post_1").topic).toBe("contribution.room");
  });
});
