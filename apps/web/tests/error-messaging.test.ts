import { describe, expect, it } from "vitest";

import { ApiClientError } from "../src/lib/api/types";
import { toUserFacingApiErrorMessage } from "../src/lib/ui/error-messaging";

describe("user-facing error messaging", () => {
  it("maps transport failures to API unavailable copy", () => {
    const message = toUserFacingApiErrorMessage(
      new ApiClientError({
        kind: "transport",
        code: "TRANSPORT_ERROR",
        message: "Network request failed."
      }),
      "fallback"
    );

    expect(message).toContain("API is unavailable");
  });

  it("maps unauthenticated failures to session-expired copy", () => {
    const message = toUserFacingApiErrorMessage(
      new ApiClientError({
        kind: "api",
        code: "UNAUTHENTICATED",
        message: "Authentication is required."
      }),
      "fallback"
    );

    expect(message).toContain("session expired");
  });
});
