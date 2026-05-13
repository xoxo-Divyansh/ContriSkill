import { describe, expect, it } from "vitest";

import { FoundationShell } from "../src";

describe("FoundationShell", () => {
  it("is exported as a function", () => {
    expect(typeof FoundationShell).toBe("function");
  });
});
