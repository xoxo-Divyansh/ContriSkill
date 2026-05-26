"use client";

import { useEffect } from "react";
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
  const { session, isReady } = useSession();
  const redirectTarget =
    session.sessionState === "expired"
      ? `${routePaths.signIn}?reason=session_expired`
      : `${routePaths.signIn}?reason=unauthorized`;

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!shouldAllowAuthenticatedRoute(session)) {
      if (typeof window !== "undefined") {
        window.location.replace(redirectTarget);
      }
    }
  }, [isReady, session, redirectTarget]);

  if (!isReady) {
    return <div data-route-intent={`redirect:${redirectTarget}`}>SESSION_CHECK_IN_PROGRESS</div>;
  }

  if (shouldAllowAuthenticatedRoute(session)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div data-route-intent={`redirect:${redirectTarget}`}>
          ACCESS_REQUIRED_OR_SESSION_EXPIRED
        </div>
      )}
    </>
  );
};
