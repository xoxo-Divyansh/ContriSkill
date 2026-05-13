import { describe, expect, it } from "vitest";

import { log } from "../src";

describe("logger", () => {
  it("is callable for structured logs", () => {
    expect(() => log("info", "test")).not.toThrow();
  });
});
