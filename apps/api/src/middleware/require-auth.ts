import type { NextFunction, Request, Response } from "express";

import { assertAuthenticatedActor } from "../modules/auth/authorization";
import { AuthorizationError } from "../modules/auth/capabilities";
import {
    auditCapabilityDenial,
    buildAuthorizationErrorResponse
} from "../security/capability-audit";

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
      // Audit the auth failure
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
        "auth:session:read",
        false, // Not authenticated
        auditContext
      );

      // Send normalized response
      const errorResponse = buildAuthorizationErrorResponse(
        auditResult,
        response.req?.correlationId
      );
      response.status(401).json(errorResponse);
      return;
    }

    next(error);
  }
};
