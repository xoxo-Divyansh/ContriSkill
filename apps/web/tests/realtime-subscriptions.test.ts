import { describe, expect, it } from "vitest";

import {
  actorSystemSubscription,
  contributionDetailSubscription,
  contributionListSubscription,
  contributionPresenceSubscription,
  contributionWorkspaceSessionSubscription
} from "../src/lib/realtime/subscriptions";

describe("realtime subscription helpers", () => {
  it("creates typed actor and contribution subscriptions", () => {
    expect(actorSystemSubscription("usr_1")).toEqual({
      scope: { type: "actor", id: "usr_1" },
      topic: "system.actor"
    });
    expect(contributionListSubscription().topic).toBe("contribution:list");
    expect(contributionDetailSubscription("post_1").topic).toBe("contribution:post_1");
    expect(contributionPresenceSubscription("post_1").topic).toBe("contribution:post_1");
    expect(contributionWorkspaceSessionSubscription("post_1").topic).toBe("contribution:post_1");
  });
});
