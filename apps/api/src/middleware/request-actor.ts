import type { NextFunction, Request, Response } from "express";

import { isAuthRole } from "../modules/auth/policies";
import {
  authActorTypes,
  authSessionStates,
  defaultRequestActor,
  requestActorHeaderKeys,
  type AuthActorType,
  type AuthSessionState,
  type RequestActor
} from "../modules/auth/types";

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

export const requestActorMiddleware = (
  request: Request,
  _response: Response,
  next: NextFunction
): void => {
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
    request.actor = {
      actorType,
      role,
      sessionState,
      userId
    };
  } else {
    request.actor = {
      ...defaultRequestActor
    };
  }

  next();
};
