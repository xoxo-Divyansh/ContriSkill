"use client";

import type { Role } from "@contriskill/domain";
import React, { type ReactNode } from "react";

import { useSession } from "../../providers/session-provider";
import type { SessionSnapshot } from "../../types/session";

import { hasRequiredRole, isAuthenticatedSession, routePaths } from "./route-policy";

export type RequireRoleProps = {
  children?: ReactNode;
  minimumRole: Role;
  fallback?: ReactNode;
};

export const canAccessRoleGuard = (session: SessionSnapshot, minimumRole: Role): boolean => {
  if (!isAuthenticatedSession(session)) {
    return false;
  }

  return hasRequiredRole(session.role, minimumRole);
};

export const RequireRole = ({ children, minimumRole, fallback }: RequireRoleProps) => {
  const { session, isReady } = useSession();
  const deniedTarget =
    session.actorType === "authenticated"
      ? `${routePaths.appHome}?reason=forbidden`
      : `${routePaths.signIn}?reason=unauthorized`;

  if (!isReady) {
    return (
      <>
        {fallback ?? (
          <div data-route-intent={`redirect:${deniedTarget}`}>
            PERMISSION_CHECK_IN_PROGRESS:{minimumRole}
          </div>
        )}
      </>
    );
  }

  if (canAccessRoleGuard(session, minimumRole)) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback ?? (
        <div data-route-intent={`redirect:${deniedTarget}`}>
          PERMISSION_DENIED:{minimumRole}
        </div>
      )}
    </>
  );
};
