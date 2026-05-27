import { describe, expect, it } from "vitest";

import { RealtimeConnectionRegistry } from "../src/realtime/connection-registry";

describe("RealtimeConnectionRegistry", () => {
  it("registers connections and manages subscriptions", () => {
    const registry = new RealtimeConnectionRegistry();
    registry.register({
      connectionId: "conn_1",
      reconnectToken: "rt_1",
      connectedAt: new Date().toISOString(),
      actor: {
        actorType: "authenticated",
        role: "user",
        sessionState: "authenticated",
        userId: "usr_1"
      },
      state: "connected",
      lastHeartbeatAt: new Date().toISOString()
    });

    const subscription = registry.subscribe(
      "conn_1",
      { type: "contribution", id: "post_1" },
      "contribution:post_1"
    );

    expect(subscription.connectionId).toBe("conn_1");
    expect(
      registry.getTargetsByScope({ type: "contribution", id: "post_1" })[0]?.connectionId
    ).toBe("conn_1");

    expect(
      registry.unsubscribe("conn_1", { type: "contribution", id: "post_1" }, "contribution:post_1")
    ).toBe(true);
    expect(registry.getTargetsByScope({ type: "contribution", id: "post_1" })).toHaveLength(0);
  });
});
