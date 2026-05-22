import { describe, expect, it } from "vitest";

import {
  formatSyncSummary,
  getRealtimeLabel,
  getSyncSurfaceLabel,
  resolveRealtimeTone
} from "../src/lib/ui/workspace-status";

describe("workspace status helpers", () => {
  it("maps realtime state to tone", () => {
    expect(resolveRealtimeTone("connected")).toBe("success");
    expect(resolveRealtimeTone("reconnecting")).toBe("warning");
    expect(resolveRealtimeTone("connecting")).toBe("warning");
    expect(resolveRealtimeTone("disconnected")).toBe("danger");
  });

  it("formats realtime labels", () => {
    expect(getRealtimeLabel("connected")).toBe("Realtime connected");
    expect(getRealtimeLabel("reconnecting")).toBe("Realtime reconnecting");
    expect(getRealtimeLabel("connecting")).toBe("Realtime connecting");
    expect(getRealtimeLabel("disconnected")).toBe("Realtime offline");
  });

  it("formats sync summary defensively", () => {
    expect(formatSyncSummary({ draftPending: 2, projectionPending: 1 })).toBe(
      "draft pending 2 / projection pending 1"
    );
  });

  it("derives sync surface labels", () => {
    expect(
      getSyncSurfaceLabel({
        isSyncing: false,
        hasError: true,
        hasStatus: false,
        idleLabel: "Idle"
      })
    ).toBe("Needs attention");

    expect(
      getSyncSurfaceLabel({
        isSyncing: true,
        hasError: false,
        hasStatus: false,
        idleLabel: "Idle"
      })
    ).toBe("Syncing");

    expect(
      getSyncSurfaceLabel({
        isSyncing: false,
        hasError: false,
        hasStatus: true,
        idleLabel: "Idle"
      })
    ).toBe("Synchronized");

    expect(
      getSyncSurfaceLabel({
        isSyncing: false,
        hasError: false,
        hasStatus: false,
        idleLabel: "Idle"
      })
    ).toBe("Idle");
  });
});
