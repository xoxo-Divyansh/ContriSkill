import type { AuthRole, RequestActor } from "./types";

export const authCapabilities = [
  "auth:register",
  "auth:login",
  "auth:refresh",
  "auth:logout",
  "auth:session:read",
  "contribution:read",
  "contribution:create",
  "contribution:update",
  "contribution:cancel",
  "contribution:state:transition",
  "contribution:application:submit",
  "contribution:application:accept",
  "mutation:submit",
  "moderation:case:read",
  "moderation:case:write",
  "admin:roles:manage"
] as const;

export type AuthCapability = (typeof authCapabilities)[number];

const roleCapabilities: Record<AuthRole, readonly AuthCapability[]> = {
  public: ["auth:register", "auth:login"],
  user: [
    "auth:refresh",
    "auth:logout",
    "auth:session:read",
    "contribution:read",
    "contribution:create",
    "contribution:update",
    "contribution:cancel",
    "contribution:state:transition",
    "contribution:application:submit",
    "contribution:application:accept",
    "mutation:submit"
  ],
  participant: [
    "auth:refresh",
    "auth:logout",
    "auth:session:read",
    "contribution:read",
    "contribution:create",
    "contribution:update",
    "contribution:cancel",
    "contribution:state:transition",
    "contribution:application:submit",
    "contribution:application:accept",
    "mutation:submit"
  ],
  owner: [
    "auth:refresh",
    "auth:logout",
    "auth:session:read",
    "contribution:read",
    "contribution:create",
    "contribution:update",
    "contribution:cancel",
    "contribution:state:transition",
    "contribution:application:submit",
    "contribution:application:accept",
    "mutation:submit"
  ],
  moderator: [
    "auth:refresh",
    "auth:logout",
    "auth:session:read",
    "contribution:read",
    "contribution:create",
    "contribution:update",
    "contribution:cancel",
    "contribution:state:transition",
    "contribution:application:submit",
    "contribution:application:accept",
    "mutation:submit",
    "moderation:case:read",
    "moderation:case:write"
  ],
  admin: [
    "auth:refresh",
    "auth:logout",
    "auth:session:read",
    "contribution:read",
    "contribution:create",
    "contribution:update",
    "contribution:cancel",
    "contribution:state:transition",
    "contribution:application:submit",
    "contribution:application:accept",
    "mutation:submit",
    "moderation:case:read",
    "moderation:case:write",
    "admin:roles:manage"
  ]
};

export type AuthorizationErrorCode = "UNAUTHENTICATED" | "FORBIDDEN";

export class AuthorizationError extends Error {
  constructor(
    public readonly code: AuthorizationErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const getRoleCapabilities = (role: AuthRole): readonly AuthCapability[] => {
  return roleCapabilities[role];
};

export const getActorCapabilities = (
  actor: RequestActor | undefined
): readonly AuthCapability[] => {
  if (!actor) {
    return roleCapabilities.public;
  }
  return getRoleCapabilities(actor.role);
};
