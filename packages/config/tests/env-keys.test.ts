import { describe, expect, it } from "vitest";

import { sharedEnvKeys } from "../src";

describe("shared env keys", () => {
  it("contains database key", () => {
    expect(sharedEnvKeys.databaseUrl).toBe("DATABASE_URL");
  });

  it("contains realtime url key", () => {
    expect(sharedEnvKeys.webRealtimeUrl).toBe("NEXT_PUBLIC_REALTIME_URL");
  });
});
