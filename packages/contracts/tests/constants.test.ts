import { describe, expect, it } from "vitest";

import { apiErrorCodes, httpStatus } from "../src";

describe("contract constants", () => {
  it("contains api error code constants", () => {
    expect(apiErrorCodes.includes("UNAUTHENTICATED")).toBe(true);
    expect(apiErrorCodes.includes("STATE_CONFLICT")).toBe(true);
  });

  it("contains core http status constants", () => {
    expect(httpStatus.unauthorized).toBe(401);
    expect(httpStatus.conflict).toBe(409);
  });
});
