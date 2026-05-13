import { describe, expect, it } from "vitest";

import { normalizeApiError, normalizeTransportError } from "../src/lib/api/error-normalizer";

describe("error normalizer", () => {
  it("maps known API errors to normalized API client errors", () => {
    const error = normalizeApiError(401, {
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required."
      }
    });

    expect(error.kind).toBe("api");
    expect(error.code).toBe("UNAUTHENTICATED");
    expect(error.status).toBe(401);
  });

  it("maps malformed API error payloads to invalid response errors", () => {
    const error = normalizeApiError(500, {
      message: "unexpected"
    });

    expect(error.kind).toBe("invalid_response");
    expect(error.code).toBe("INVALID_RESPONSE");
    expect(error.status).toBe(500);
  });

  it("maps timeout transport failures consistently", () => {
    const error = normalizeTransportError(new Error("abort"), true);

    expect(error.kind).toBe("transport");
    expect(error.code).toBe("TRANSPORT_ERROR");
    expect(error.transportErrorKind).toBe("timeout");
  });
});
