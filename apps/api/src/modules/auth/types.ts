import type { AuthActor, Role, SessionState } from "@contriskill/domain";
import type { Request } from "express";

export const authRoles = ["public", "user", "participant", "owner", "moderator", "admin"] as const;

export type AuthRole = (typeof authRoles)[number];

export const authActorTypes = ["anonymous", "authenticated"] as const;

export type AuthActorType = (typeof authActorTypes)[number];

export const authSessionStates = ["anonymous", "authenticated", "expired"] as const;

export type AuthSessionState = (typeof authSessionStates)[number];

export type RequestActor = {
  actorType: AuthActorType;
  role: AuthRole;
  sessionState: AuthSessionState;
  userId?: string;
};

export type SessionActor = AuthActor;

export type SessionRole = Role;

export type SessionLifecycleState = SessionState;

export type AuthenticatedActor = RequestActor & {
  actorType: "authenticated";
  sessionState: "authenticated";
  userId: string;
};

export type RequestWithActor = Request & {
  actor?: RequestActor;
};

export type SessionIdentifier = string;
export type SessionToken = string;
export type RefreshToken = string;

export type AuthSessionRecord = {
  id: SessionIdentifier;
  userId: string;
  role: SessionRole;
  state: SessionLifecycleState;
  accessToken: SessionToken;
  refreshToken: RefreshToken;
  issuedAt: string;
  expiresAt: string;
  lastSeenAt: string;
  revokedAt?: string;
};

export const requestActorHeaderKeys = {
  actorType: "x-actor-type",
  role: "x-actor-role",
  sessionState: "x-session-state",
  userId: "x-actor-id"
} as const;

export const defaultRequestActor: RequestActor = {
  actorType: "anonymous",
  role: "public",
  sessionState: "anonymous"
};
