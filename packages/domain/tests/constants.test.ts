import { describe, expect, it } from "vitest";

import { authProviderTypes, roles, sessionStates } from "../src";

describe("domain constants", () => {
  it("contains canonical role constants", () => {
    expect(roles.includes("user")).toBe(true);
    expect(roles.includes("admin")).toBe(true);
  });

  it("contains canonical session constants", () => {
    expect(sessionStates.includes("anonymous")).toBe(true);
    expect(sessionStates.includes("authenticated")).toBe(true);
  });

  it("contains auth provider constants", () => {
    expect(authProviderTypes.includes("password")).toBe(true);
  });
});
