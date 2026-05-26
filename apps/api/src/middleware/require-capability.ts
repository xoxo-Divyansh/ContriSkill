import type { NextFunction, Request, Response } from "express";

import { assertActorCapability } from "../modules/auth/authorization";
import { AuthorizationError, type AuthCapability } from "../modules/auth/capabilities";

import { handleAuthorizationFailure } from "./security-response";

export const requireCapabilityMiddleware = (capability: AuthCapability) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      assertActorCapability(request.actor, capability);
      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        handleAuthorizationFailure(request, response, error, capability);
        return;
      }

      next(error);
    }
  };
};
