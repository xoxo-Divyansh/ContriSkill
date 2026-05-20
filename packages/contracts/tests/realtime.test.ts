import { describe, expect, it } from "vitest";

import { realtimeEventNames, realtimeEventVersion } from "../src";

describe("realtime contracts", () => {
  it("exposes versioned event names", () => {
    expect(realtimeEventVersion).toBe(1);
    expect(realtimeEventNames.serverConnected.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.clientSubscribe.endsWith(".v1")).toBe(true);
    expect(realtimeEventNames.contributionPresenceSnapshot.endsWith(".v1")).toBe(true);
  });
});
