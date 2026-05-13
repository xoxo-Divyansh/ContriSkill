import { describe, expect, it } from "vitest";

import { collaborationStates, postStates } from "../src";

describe("domain states", () => {
  it("contains canonical post states", () => {
    expect(postStates.includes("open")).toBe(true);
  });

  it("contains canonical collaboration states", () => {
    expect(collaborationStates.includes("under_moderation")).toBe(true);
  });
});
