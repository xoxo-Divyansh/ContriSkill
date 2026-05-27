import type { NextFunction, Request, Response } from "express";

import { assertMinimumRole } from "../modules/auth/authorization";
import { AuthorizationError } from "../modules/auth/capabilities";
import type { AuthRole } from "../modules/auth/types";
import {
    auditCapabilityDenial,
    buildAuthorizationErrorResponse
} from "../security/capability-audit";

export const requireRoleMiddleware = (minimumRole: AuthRole) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    try {
      assertMinimumRole(request.actor, minimumRole);
      next();
    } catch (error) {
      if (error instanceof AuthorizationError) {
        // Audit the role denial
        const isAuthenticated = request.actor?.actorType === "authenticated";
        const auditContext: {
          correlationId?: string;
          requestPath: string;
          requestMethod: string;
          clientIp?: string;
        } = {
          requestPath: request.path,
          requestMethod: request.method
        };

        if (request.correlationId !== undefined) {
          auditContext.correlationId = request.correlationId;
        }

        if (request.ip !== undefined) {
          auditContext.clientIp = request.ip;
        }

        const auditResult = auditCapabilityDenial(
          request.actor,
          "admin:roles:manage",
          isAuthenticated,
          auditContext
        );
        // Send normalized response
        const statusCode = auditResult.errorCode === "UNAUTHENTICATED" ? 401 : 403;
        const errorResponse = buildAuthorizationErrorResponse(
          auditResult,
          response.req?.correlationId
        );
        response.status(statusCode).json(errorResponse);
        return;
      }

      next(error);
    }
  };
};
