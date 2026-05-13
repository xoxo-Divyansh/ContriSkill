import { describe, expect, it } from "vitest";

import { sharedEnvKeys } from "../src";

describe("shared env keys", () => {
  it("contains database key", () => {
    expect(sharedEnvKeys.databaseUrl).toBe("DATABASE_URL");
  });
});
