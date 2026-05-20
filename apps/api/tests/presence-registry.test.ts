import { describe, expect, it } from "vitest";

import { RealtimePresenceRegistry } from "../src/realtime/presence-registry";

describe("realtime presence registry", () => {
  it("tracks room presence across multi-connection users", () => {
    const registry = new RealtimePresenceRegistry();

    const firstJoin = registry.joinRoom("conn_1", "post_1", "usr_1");
    expect(firstJoin.joined).toBe(true);
    expect(firstJoin.activeUserIds).toEqual(["usr_1"]);

    const secondJoin = registry.joinRoom("conn_2", "post_1", "usr_1");
    expect(secondJoin.joined).toBe(false);
    expect(secondJoin.activeUserIds).toEqual(["usr_1"]);

    const leaveOne = registry.leaveRoom("conn_1", "post_1", "usr_1");
    expect(leaveOne.left).toBe(false);
    expect(leaveOne.activeUserIds).toEqual(["usr_1"]);

    const leaveLast = registry.leaveRoom("conn_2", "post_1", "usr_1");
    expect(leaveLast.left).toBe(true);
    expect(leaveLast.activeUserIds).toEqual([]);
  });
});
