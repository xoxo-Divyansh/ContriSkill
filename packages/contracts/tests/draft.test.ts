import { describe, expect, it } from "vitest";

import { realtimeEventNames, sharedDraftTargetTypes, sharedDraftVersion } from "../src";

describe("shared draft contracts", () => {
  it("exposes draft version and target types", () => {
    expect(sharedDraftVersion).toBe(1);
    expect(sharedDraftTargetTypes).toContain("contribution.post");
  });

  it("exposes realtime draft event names", () => {
    expect(realtimeEventNames.draftSnapshot.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.draftPatched.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.draftAcknowledged.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.draftRejected.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.draftConflict.endsWith(".v1")).toBe(true);
  });
});
