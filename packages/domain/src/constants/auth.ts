import type { Role } from "./roles.js";
import type { SessionState } from "./session.js";

export const authProviderTypes = ["password", "google"] as const;

export type AuthProviderType = (typeof authProviderTypes)[number];

export const authActorTypes = ["anonymous", "authenticated"] as const;

export type AuthActorType = (typeof authActorTypes)[number];

export type AuthActor = {
  actorType: AuthActorType;
  userId?: string;
  role: Role;
  sessionState: SessionState;
};
