import { AuthorizationError, type AuthCapability, getActorCapabilities } from "./capabilities";
import { hasRequiredRole } from "./policies";
import type { AuthRole } from "./types";
import type { RequestActor } from "./types";

const isAuthenticatedActor = (
  actor: RequestActor | undefined
): actor is RequestActor & {
  actorType: "authenticated";
  sessionState: "authenticated";
  userId: string;
} => {
  return (
    actor?.actorType === "authenticated" &&
    actor.sessionState === "authenticated" &&
    Boolean(actor.userId)
  );
};

export function assertAuthenticatedActor(
  actor: RequestActor | undefined
): asserts actor is RequestActor & {
  actorType: "authenticated";
  sessionState: "authenticated";
  userId: string;
} {
  if (!isAuthenticatedActor(actor)) {
    throw new AuthorizationError(
      "UNAUTHENTICATED",
      "Authentication is required for this endpoint."
    );
  }
}

export const canActor = (actor: RequestActor | undefined, capability: AuthCapability): boolean => {
  const capabilities = getActorCapabilities(actor);
  return capabilities.includes(capability);
};

export const assertActorCapability = (
  actor: RequestActor | undefined,
  capability: AuthCapability
): void => {
  if (!canActor(actor, capability)) {
    if (!isAuthenticatedActor(actor)) {
      throw new AuthorizationError(
        "UNAUTHENTICATED",
        "Authentication is required for this endpoint."
      );
    }

    throw new AuthorizationError("FORBIDDEN", `Capability "${capability}" is required.`);
  }
};

export function assertMinimumRole(actor: RequestActor | undefined, minimumRole: AuthRole): void {
  assertAuthenticatedActor(actor);

  if (!hasRequiredRole(actor.role, minimumRole)) {
    throw new AuthorizationError("FORBIDDEN", `Role "${minimumRole}" is required.`);
  }
}
