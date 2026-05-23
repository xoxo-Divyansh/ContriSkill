import { ApiClientError } from "../api/types";

const isDevelopment = process.env.NODE_ENV !== "production";

const safeConsole = (
  level: "debug" | "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>
): void => {
  if (!isDevelopment) {
    return;
  }
  console[level](`[observability] ${message}`, context ?? {});
};

export const logClientDiagnostic = (
  level: "debug" | "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>
): void => {
  safeConsole(level, message, context);
};

export const getSafeApiErrorReference = (
  error: unknown
): {
  message: string;
  correlationId?: string;
} => {
  if (!(error instanceof ApiClientError)) {
    return {
      message: "Request failed."
    };
  }

  return {
    message: error.message,
    ...(error.correlationId ? { correlationId: error.correlationId } : {})
  };
};
