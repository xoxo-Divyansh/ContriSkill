import type { Role } from "@contriskill/domain";

import type { SessionSnapshot } from "../../types/session";

export const routePaths = {
  root: "/",
  publicHome: "/home",
  signIn: "/sign-in",
  appHome: "/app"
} as const;

export type RouteKey = keyof typeof routePaths;

export type RoutePolicy = {
  requiresAuth: boolean;
  minimumRole: Role;
  redirectAuthenticatedTo?: (typeof routePaths)[RouteKey];
  redirectUnauthenticatedTo?: (typeof routePaths)[RouteKey];
};

export const routePolicies: Record<RouteKey, RoutePolicy> = {
  root: {
    requiresAuth: false,
    minimumRole: "public"
  },
  publicHome: {
    requiresAuth: false,
    minimumRole: "public",
    redirectAuthenticatedTo: routePaths.appHome
  },
  signIn: {
    requiresAuth: false,
    minimumRole: "public",
    redirectAuthenticatedTo: routePaths.appHome
  },
  appHome: {
    requiresAuth: true,
    minimumRole: "user",
    redirectUnauthenticatedTo: routePaths.signIn
  }
};

const rolePrecedence: Record<Role, number> = {
  public: 0,
  user: 1,
  participant: 2,
  owner: 3,
  moderator: 4,
  admin: 5
};

export const isAuthenticatedSession = (session: SessionSnapshot): boolean => {
  return session.actorType === "authenticated" && session.sessionState === "authenticated";
};

export const hasRequiredRole = (sessionRole: Role, minimumRole: Role): boolean => {
  return rolePrecedence[sessionRole] >= rolePrecedence[minimumRole];
};

export const resolveRootRouteTarget = (session: SessionSnapshot): string => {
  return isAuthenticatedSession(session) ? routePaths.appHome : routePaths.publicHome;
};
