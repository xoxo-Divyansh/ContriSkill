import { describe, expect, it } from "vitest";

import { RealtimeWorkspaceSessionRegistry } from "../src/realtime/workspace-session-registry";

describe("workspace session registry", () => {
  it("tracks join/leave and duplicate-connection coordination", () => {
    const registry = new RealtimeWorkspaceSessionRegistry();

    const first = registry.joinSession({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      actorId: "usr_1",
      clientId: "web",
      connectionId: "conn_1",
      capabilities: ["workspace:session:join"]
    });
    expect(first.joined).toBe(true);
    expect(first.participants).toHaveLength(1);

    const second = registry.joinSession({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      actorId: "usr_1",
      clientId: "web",
      connectionId: "conn_2",
      capabilities: ["workspace:session:join"]
    });
    expect(second.joined).toBe(false);
    expect(second.updated).toBe(true);
    expect(second.session.connectionIds).toHaveLength(2);

    const leaveOne = registry.leaveSession({
      workspaceId: "workspace:post_1",
      actorId: "usr_1",
      connectionId: "conn_1"
    });
    expect(leaveOne.left).toBe(false);
    expect(leaveOne.session?.connectionIds).toHaveLength(1);

    const leaveLast = registry.leaveSession({
      workspaceId: "workspace:post_1",
      actorId: "usr_1",
      connectionId: "conn_2"
    });
    expect(leaveLast.left).toBe(true);
    expect(leaveLast.participants).toHaveLength(0);
  });

  it("cleans stale sessions", () => {
    const registry = new RealtimeWorkspaceSessionRegistry();
    registry.joinSession({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      actorId: "usr_1",
      clientId: "web",
      connectionId: "conn_1",
      capabilities: ["workspace:session:join"]
    });
    const stale = registry.cleanupStaleSessions(-1);
    expect(stale).toHaveLength(1);
    expect(stale[0]?.session.sessionState).toBe("stale");
  });
});
