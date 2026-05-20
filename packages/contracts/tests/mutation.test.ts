import { describe, expect, it } from "vitest";

import {
  collaborativeMutationTargetTypes,
  collaborativeMutationTypes,
  collaborativeMutationVersion,
  realtimeEventNames
} from "../src";

describe("collaborative mutation contracts", () => {
  it("exposes mutation version and target/mutation types", () => {
    expect(collaborativeMutationVersion).toBe(1);
    expect(collaborativeMutationTargetTypes).toContain("contribution.post");
    expect(collaborativeMutationTypes).toContain("contribution.post.update.v1");
  });

  it("exposes mutation lifecycle realtime event names", () => {
    expect(realtimeEventNames.mutationAcknowledged.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.mutationRejected.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.mutationConflict.endsWith(".v1")).toBe(true);
  });
});
