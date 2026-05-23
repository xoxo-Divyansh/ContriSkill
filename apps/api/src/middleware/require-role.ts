import type { NextFunction, Request, Response } from "express";

import { sendApiError } from "../api-error";
import { assertMinimumRole } from "../modules/auth/authorization";
import { AuthorizationError } from "../modules/auth/capabilities";
import type { AuthRole } from "../modules/auth/types";

export const requireRoleMiddleware = (minimumRole: AuthRole) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      assertMinimumRole(request.actor, minimumRole);
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
