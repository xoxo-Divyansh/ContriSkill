"use client";

import React, { type ReactNode } from "react";

import { useSession } from "../../providers/session-provider";
import type { SessionSnapshot } from "../../types/session";

import { isAuthenticatedSession, routePaths } from "./route-policy";

export type RedirectIfAuthProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export const shouldRedirectAuthenticatedUser = (session: SessionSnapshot): boolean => {
  return isAuthenticatedSession(session);
};

export const RedirectIfAuth = ({ children, fallback }: RedirectIfAuthProps) => {
  const { session } = useSession();

  if (!shouldRedirectAuthenticatedUser(session)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div data-route-intent={`redirect:${routePaths.appHome}`}>
          OPEN_DECISION_ROUTE_GUARD_REDIRECT_IF_AUTH
        </div>
      )}
    </>
  );
};
