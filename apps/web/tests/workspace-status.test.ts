import { describe, expect, it } from "vitest";

import { formatSyncSummary, resolveRealtimeTone } from "../src/lib/ui/workspace-status";

describe("workspace status helpers", () => {
  it("maps realtime state to tone", () => {
    expect(resolveRealtimeTone("connected")).toBe("success");
    expect(resolveRealtimeTone("reconnecting")).toBe("warning");
    expect(resolveRealtimeTone("connecting")).toBe("warning");
    expect(resolveRealtimeTone("disconnected")).toBe("muted");
  });

  it("formats sync summary defensively", () => {
    expect(formatSyncSummary({ draftPending: 2, projectionPending: 1 })).toBe(
      "draft pending: 2 | projection pending: 1"
    );
  });
});
