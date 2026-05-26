import type { NextFunction, Request, Response } from "express";

import { assertAuthenticatedActor } from "../modules/auth/authorization";
import { AuthorizationError } from "../modules/auth/capabilities";

import { handleAuthorizationFailure } from "./security-response";

export const requireAuthMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  try {
    assertAuthenticatedActor(request.actor);
    next();
    return;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      handleAuthorizationFailure(request, response, error);
      return;
    }

    next(error);
  }
};
