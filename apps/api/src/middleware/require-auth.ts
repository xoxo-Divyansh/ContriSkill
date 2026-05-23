import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../api-error";
import { assertAuthenticatedActor } from "../modules/auth/authorization";
import { AuthorizationError } from "../modules/auth/capabilities";

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
      sendApiError(response, 401, "UNAUTHENTICATED", error.message);
      return;
    }

    next(error);
  }
};
