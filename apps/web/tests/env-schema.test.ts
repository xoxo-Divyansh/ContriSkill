import { describe, expect, it } from "vitest";

import { parseWebEnv } from "../src/config/env-schema";

describe("parseWebEnv", () => {
  it("parses required web env", () => {
    const env = parseWebEnv({
      NEXT_PUBLIC_APP_NAME: "ContriSkill",
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000"
    });

    expect(env.appName).toBe("ContriSkill");
    expect(env.apiBaseUrl).toBe("http://localhost:4000/");
  });

  it("fails fast when NEXT_PUBLIC_API_BASE_URL is missing", () => {
    expect(() => parseWebEnv({})).toThrow();
  });
});
