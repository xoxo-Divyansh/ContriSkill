import type { Response } from "express";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "STATE_CONFLICT";

export const sendApiError = (
  response: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, string | number | boolean>
): void => {
  response.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
};
