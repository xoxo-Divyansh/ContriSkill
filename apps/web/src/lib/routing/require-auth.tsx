"use client";

import React, { type ReactNode } from "react";

import { useSession } from "../../providers/session-provider";
import type { SessionSnapshot } from "../../types/session";

import { isAuthenticatedSession, routePaths } from "./route-policy";

export type RequireAuthProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export const shouldAllowAuthenticatedRoute = (session: SessionSnapshot): boolean => {
  return isAuthenticatedSession(session);
};

export const RequireAuth = ({ children, fallback }: RequireAuthProps) => {
  const { session } = useSession();

  if (shouldAllowAuthenticatedRoute(session)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div data-route-intent={`redirect:${routePaths.signIn}`}>ROUTE_GUARD_REQUIRE_AUTH</div>
      )}
    </>
  );
};
