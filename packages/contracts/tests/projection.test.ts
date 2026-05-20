import { describe, expect, it } from "vitest";

import { realtimeEventNames, sharedProjectionTargetTypes, sharedProjectionVersion } from "../src";

describe("shared projection contracts", () => {
  it("exposes projection version and target types", () => {
    expect(sharedProjectionVersion).toBe(1);
    expect(sharedProjectionTargetTypes).toContain("contribution.workspace");
  });

  it("exposes realtime projection event names", () => {
    expect(realtimeEventNames.projectionSnapshot.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.projectionUpdated.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.projectionAcknowledged.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.projectionRejected.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.projectionConflict.endsWith(".v1")).toBe(true);
  });
});
