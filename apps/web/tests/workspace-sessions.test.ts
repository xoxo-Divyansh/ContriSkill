import { describe, expect, it } from "vitest";

import { createWorkspaceSessionStore } from "../src/lib/realtime/workspace-sessions";

describe("workspace session store", () => {
  it("hydrates snapshot and applies lifecycle updates", () => {
    const store = createWorkspaceSessionStore();

    store.applySnapshot({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      participants: [],
      generatedAt: new Date().toISOString()
    });

    store.applyLifecycle({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      session: {
        workspaceSessionId: "wss_1",
        workspaceId: "workspace:post_1",
        targetId: "post_1",
        actorId: "usr_1",
        clientId: "web",
        connectionIds: ["conn_1"],
        sessionState: "active",
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        capabilities: ["workspace:session:join"]
      }
    });

    expect(store.getState().participants).toHaveLength(1);
    expect(store.getState().participants[0]?.actorId).toBe("usr_1");
  });

  it("removes participant on left event", () => {
    const store = createWorkspaceSessionStore();
    store.applySnapshot({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      participants: [
        {
          workspaceSessionId: "wss_1",
          workspaceId: "workspace:post_1",
          targetId: "post_1",
          actorId: "usr_1",
          clientId: "web",
          connectionIds: ["conn_1"],
          sessionState: "active",
          joinedAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          capabilities: ["workspace:session:join"]
        }
      ],
      generatedAt: new Date().toISOString()
    });

    store.applyLeft({
      workspaceId: "workspace:post_1",
      targetId: "post_1",
      workspaceSessionId: "wss_1",
      actorId: "usr_1",
      sessionState: "left",
      leftAt: new Date().toISOString()
    });

    expect(store.getState().participants).toHaveLength(0);
  });
});
