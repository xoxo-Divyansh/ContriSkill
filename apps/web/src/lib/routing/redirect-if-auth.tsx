"use client";

import { useEffect } from "react";
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
  const { session, isReady } = useSession();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (shouldRedirectAuthenticatedUser(session)) {
      if (typeof window !== "undefined") {
        window.location.replace(routePaths.appHome);
      }
    }
  }, [isReady, session]);

  if (!isReady) {
    return <>{children}</>;
  }

  if (!shouldRedirectAuthenticatedUser(session)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div data-route-intent={`redirect:${routePaths.appHome}`}>ROUTE_GUARD_REDIRECT_IF_AUTH</div>
      )}
    </>
  );
};
