import type { NextFunction, Request, Response } from "express";

import { hasRequiredRole } from "../modules/auth/policies";
import type { AuthRole } from "../modules/auth/types";

export const requireRoleMiddleware = (minimumRole: AuthRole) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const actor = request.actor;

    if (!actor) {
      response.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required for this endpoint."
        }
      });
      return;
    }

    if (!hasRequiredRole(actor.role, minimumRole)) {
      response.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Role "${minimumRole}" is required.`
        }
      });
      return;
    }

    next();
  };
};
