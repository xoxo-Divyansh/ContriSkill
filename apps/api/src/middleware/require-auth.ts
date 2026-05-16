import type { NextFunction, Request, Response } from "express";

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
      response.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: error.message
        }
      });
      return;
    }

    next(error);
  }
};
