import type { RealtimeSubscription } from "@contriskill/contracts";

import { canActor } from "../modules/auth/authorization";
import type { RequestActor } from "../modules/auth/types";

type AuthorizationResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: "UNAUTHENTICATED" | "FORBIDDEN" };

export const authorizeSubscription = (
  actor: RequestActor | undefined,
  subscription: RealtimeSubscription
): AuthorizationResult => {
  if (!actor || actor.actorType !== "authenticated" || actor.sessionState !== "authenticated") {
    return { allowed: false, reason: "Authenticated actor required.", code: "UNAUTHENTICATED" };
  }

  if (subscription.scope.type === "actor") {
    if (actor.userId !== subscription.scope.id) {
      return {
        allowed: false,
        reason: "Actor can subscribe only to own scope.",
        code: "FORBIDDEN"
      };
    }

    if (!canActor(actor, "auth:session:read")) {
      return { allowed: false, reason: "Missing auth session read capability.", code: "FORBIDDEN" };
    }

    return { allowed: true };
  }

  if (subscription.scope.type === "contribution") {
    if (!canActor(actor, "contribution:read")) {
      return { allowed: false, reason: "Missing contribution read capability.", code: "FORBIDDEN" };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Unsupported subscription scope.", code: "FORBIDDEN" };
};
