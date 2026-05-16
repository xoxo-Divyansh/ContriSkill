import type { NextFunction, Request, Response } from "express";

import { isAuthRole } from "../modules/auth/policies";
import type { SessionResolver } from "../modules/auth/session";
import {
  authActorTypes,
  authSessionStates,
  defaultRequestActor,
  requestActorHeaderKeys,
  type AuthActorType,
  type AuthSessionState,
  type RequestActor
} from "../modules/auth/types";
import { log } from "../observability/logger";

declare module "express-serve-static-core" {
  interface Request {
    actor?: RequestActor;
  }
}

const parseHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

const sessionTokenHeaderKey = "x-session-token";

const sessionCookieKey = "contriskill_session";

const parseActorType = (value: string | undefined): AuthActorType => {
  if (!value) {
    return defaultRequestActor.actorType;
  }

  return authActorTypes.includes(value as AuthActorType)
    ? (value as AuthActorType)
    : defaultRequestActor.actorType;
};

const parseSessionState = (value: string | undefined): AuthSessionState => {
  if (!value) {
    return defaultRequestActor.sessionState;
  }

  return authSessionStates.includes(value as AuthSessionState)
    ? (value as AuthSessionState)
    : defaultRequestActor.sessionState;
};

const parseCookies = (value: string | undefined): Record<string, string> => {
  if (!value) {
    return {};
  }

  return value
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.length > 0)
    .reduce<Record<string, string>>((accumulator, cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex <= 0) {
        return accumulator;
      }
      const key = cookie.slice(0, separatorIndex).trim();
      const rawCookieValue = cookie.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(rawCookieValue);
      return accumulator;
    }, {});
};

export const resolveAccessTokenFromRequest = (request: Request): string | undefined => {
  const headerToken = parseHeaderValue(request.headers[sessionTokenHeaderKey]);
  if (headerToken && headerToken.trim().length > 0) {
    return headerToken.trim();
  }

  const cookieHeader = parseHeaderValue(request.headers.cookie);
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[sessionCookieKey];
  return cookieToken?.trim().length ? cookieToken.trim() : undefined;
};

const buildFallbackActorFromHeaders = (request: Request): RequestActor => {
  const actorType = parseActorType(
    parseHeaderValue(request.headers[requestActorHeaderKeys.actorType])
  );
  const sessionState = parseSessionState(
    parseHeaderValue(request.headers[requestActorHeaderKeys.sessionState])
  );
  const roleHeader = parseHeaderValue(request.headers[requestActorHeaderKeys.role]);
  const userIdHeader = parseHeaderValue(request.headers[requestActorHeaderKeys.userId]);
  const userId = userIdHeader?.trim();

  const role = roleHeader && isAuthRole(roleHeader) ? roleHeader : defaultRequestActor.role;

  if (actorType === "authenticated" && userId && sessionState === "authenticated") {
    return {
      actorType,
      role,
      sessionState,
      userId
    };
  }

  return {
    ...defaultRequestActor
  };
};

export const createRequestActorMiddleware = (sessionResolver: SessionResolver) => {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = resolveAccessTokenFromRequest(request);
      const resolvedActor = await sessionResolver.resolveActorByAccessToken(accessToken);

      request.actor = resolvedActor ?? buildFallbackActorFromHeaders(request);
      next();
    } catch (error) {
      log("error", "Request actor resolution failed. Falling back to anonymous actor.", {
        error: error instanceof Error ? error.message : "unknown"
      });
      request.actor = {
        ...defaultRequestActor
      };
      next();
    }
  };
};
