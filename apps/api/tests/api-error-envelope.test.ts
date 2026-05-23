import { describe, expect, it, vi } from "vitest";

import { sendApiError } from "../src/api-error";

describe("API error envelope", () => {
  it("emits stable error payload without internals", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const response = { status } as unknown as Parameters<typeof sendApiError>[0];

    sendApiError(response, 401, "UNAUTHENTICATED", "Authentication is required.");

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required."
      }
    });
  });
});
