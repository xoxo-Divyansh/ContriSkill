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
import { isValidTokenFormat, validateSessionRecord } from "../security/session-validation";

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
      const rawCookieValue = cookie.slice(separatorIndex + 1);
      accumulator[key] = decodeURIComponent(rawCookieValue);
      return accumulator;
    }, {});
};

export const resolveAccessTokenFromRequest = (request: Request): string | undefined => {
  const headerToken = parseHeaderValue(request.headers[sessionTokenHeaderKey]);
  if (isValidTokenFormat(headerToken)) {
    return headerToken;
  }

  const cookieHeader = parseHeaderValue(request.headers.cookie);
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[sessionCookieKey];
  return isValidTokenFormat(cookieToken) ? cookieToken : undefined;
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

      // Defensive token format validation
      if (accessToken && !isValidTokenFormat(accessToken)) {
        log("warn", "Request contains malformed session token", {
          correlationId: request.correlationId,
          requestPath: request.path,
          tokenLength: String(accessToken).length,
          suspiciousPattern: true
        });
        request.actor = buildFallbackActorFromHeaders(request);
        next();
        return;
      }

      const session = await sessionResolver.resolveActorByAccessToken(accessToken);

      // If no session found, try fallback to header-based actor
      if (!session) {
        request.actor = buildFallbackActorFromHeaders(request);
        next();
        return;
      }

      // Defensive session validation with diagnostics
      const validationContext: {
        correlationId?: string;
        requestPath?: string;
        clientIp?: string;
      } = {
        requestPath: request.path
      };

      if (request.correlationId) {
        validationContext.correlationId = request.correlationId;
      }

      if (request.ip) {
        validationContext.clientIp = request.ip;
      }

      const validationResult = validateSessionRecord(session, validationContext);

      if (!validationResult.valid && validationResult.diagnostics?.suspicious) {
        log("warn", "Session validation failed with suspicious pattern", {
          correlationId: request.correlationId,
          requestPath: request.path,
          reason: validationResult.diagnostics.reason,
          riskLevel: validationResult.diagnostics.riskLevel
        });
      }

      request.actor = validationResult.actor;
      next();
    } catch (error) {
      log("error", "Request actor resolution failed. Falling back to header-based actor.", {
        correlationId: request.correlationId,
        requestPath: request.path,
        error: error instanceof Error ? error.message : "unknown"
      });
      request.actor = buildFallbackActorFromHeaders(request);
      next();
    }
  };
};
