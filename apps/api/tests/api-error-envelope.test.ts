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

  it("attaches correlation metadata when request id is available", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const response = {
      status,
      req: { correlationId: "req_123" }
    } as unknown as Parameters<typeof sendApiError>[0];

    sendApiError(response, 403, "FORBIDDEN", "Forbidden");

    const payload = json.mock.calls[0]?.[0] as { meta?: { requestId: string } };
    expect(payload.meta?.requestId).toBe("req_123");
  });
});
