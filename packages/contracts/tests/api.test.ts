import { describe, expect, it } from "vitest";

import type { ApiSuccess } from "../src";

describe("api contracts", () => {
  it("supports success payload typing", () => {
    const response: ApiSuccess<{ ok: boolean }> = {
      data: { ok: true }
    };

    expect(response.data.ok).toBe(true);
  });
});
