import { describe, expect, it } from "vitest";

import {
  assertActorCapability,
  assertAuthenticatedActor,
  assertMinimumRole,
  canActor
} from "../src/modules/auth/authorization";
import {
  type AuthCapability,
  AuthorizationError,
  getActorCapabilities,
  getRoleCapabilities
} from "../src/modules/auth/capabilities";
import type { RequestActor } from "../src/modules/auth/types";

const authenticatedActor = (role: RequestActor["role"]): RequestActor => {
  return {
    actorType: "authenticated",
    role,
    sessionState: "authenticated",
    userId: "usr_test_actor"
  };
};

describe("authorization capability infrastructure", () => {
  it("resolves capabilities for each role through centralized mapping", () => {
    const moderatorCapabilities = getRoleCapabilities("moderator");
    const adminCapabilities = getRoleCapabilities("admin");

    expect(moderatorCapabilities).toContain("moderation:case:read");
    expect(moderatorCapabilities).toContain("moderation:case:write");
    expect(adminCapabilities).toContain("admin:roles:manage");
  });

  it("defaults to public capabilities for missing actor context", () => {
    const capabilities = getActorCapabilities(undefined);

    expect(capabilities).toContain("auth:register");
    expect(capabilities).toContain("auth:login");
  });

  it("evaluates actor capability checks consistently", () => {
    const actor = authenticatedActor("user");
    const requiredCapability: AuthCapability = "auth:session:read";
    const forbiddenCapability: AuthCapability = "moderation:case:write";

    expect(canActor(actor, requiredCapability)).toBe(true);
    expect(canActor(actor, forbiddenCapability)).toBe(false);
  });

  it("throws UNAUTHENTICATED for capability checks without authenticated actor", () => {
    expect(() => assertActorCapability(undefined, "auth:session:read")).toThrowError(
      AuthorizationError
    );

    try {
      assertActorCapability(undefined, "auth:session:read");
    } catch (error) {
      expect((error as AuthorizationError).code).toBe("UNAUTHENTICATED");
    }
  });

  it("throws FORBIDDEN when actor lacks required capability", () => {
    const actor = authenticatedActor("user");

    expect(() => assertActorCapability(actor, "moderation:case:write")).toThrowError(
      AuthorizationError
    );

    try {
      assertActorCapability(actor, "moderation:case:write");
    } catch (error) {
      expect((error as AuthorizationError).code).toBe("FORBIDDEN");
    }
  });

  it("asserts minimum role using centralized authorization helper", () => {
    const moderator = authenticatedActor("moderator");
    const user = authenticatedActor("user");

    expect(() => assertMinimumRole(moderator, "participant")).not.toThrow();
    expect(() => assertMinimumRole(user, "moderator")).toThrowError(AuthorizationError);
  });

  it("asserts authenticated actor boundary", () => {
    expect(() => assertAuthenticatedActor(undefined)).toThrowError(AuthorizationError);

    const actor = authenticatedActor("user");
    expect(() => assertAuthenticatedActor(actor)).not.toThrow();
  });
});
