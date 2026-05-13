import { describe, expect, it } from "vitest";

import { webEnv } from "../src/env";

describe("webEnv", () => {
  it("provides default app name", () => {
    expect(webEnv.appName).toBeTruthy();
  });
});
