import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../api-error";
import { assertActorCapability } from "../modules/auth/authorization";
import { AuthorizationError, type AuthCapability } from "../modules/auth/capabilities";

export const requireCapabilityMiddleware = (capability: AuthCapability) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      assertActorCapability(request.actor, capability);
      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
        sendApiError(response, status, error.code, error.message);
        return;
      }

      next(error);
    }
  };
};
