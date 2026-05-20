import { describe, expect, it } from "vitest";

import { realtimeEventNames, workspaceSessionStates, workspaceSessionVersion } from "../src";

describe("workspace session contracts", () => {
  it("exposes workspace session version and states", () => {
    expect(workspaceSessionVersion).toBe(1);
    expect(workspaceSessionStates).toContain("active");
    expect(workspaceSessionStates).toContain("stale");
  });

  it("exposes workspace session realtime event names", () => {
    expect(realtimeEventNames.workspaceSessionSnapshot.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.workspaceSessionJoined.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.workspaceSessionLeft.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.workspaceSessionUpdated.endsWith(".v1")).toBe(true);
  });
});
