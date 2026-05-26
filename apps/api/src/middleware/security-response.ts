import type { NextFunction, Request, Response } from "express";

import { AuthorizationError } from "../modules/auth/capabilities";
import { emitSecurityEvent } from "../observability/security-events";

type SecurityErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED" | "VALIDATION_ERROR";

export const sendSecurityError = (
  response: Response,
  status: number,
  code: SecurityErrorCode,
  message: string
): void => {
  response.status(status).json({
    error: {
      code,
      message
    }
  });
};

export const handleAuthorizationFailure = (
  request: Request,
  response: Response,
  error: AuthorizationError,
  capability?: string
): void => {
  const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
  const kind = error.code === "UNAUTHENTICATED" ? "auth_failure" : "capability_denied";
  emitSecurityEvent(kind, request, {
    status,
    code: error.code,
    capability
  });
  sendSecurityError(response, status, error.code, error.message);
};

const isBodySyntaxError = (error: unknown): error is SyntaxError & { status?: number } => {
  return error instanceof SyntaxError && "status" in error;
};

export const malformedPayloadMiddleware = (
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (isBodySyntaxError(error)) {
    emitSecurityEvent("malformed_request", request, { reason: "invalid_json" });
    sendSecurityError(response, 400, "VALIDATION_ERROR", "Malformed JSON payload.");
    return;
  }

  next(error);
};
