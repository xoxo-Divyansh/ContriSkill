import { ApiClientError } from "../api/types";

export const toUserFacingApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  if (error.code === "UNAUTHENTICATED") {
    return "Your session expired. Sign in again to continue.";
  }

  if (error.kind === "transport") {
    return "The API is unavailable right now. Check your connection and retry.";
  }

  if (error.status && error.status >= 500) {
    return "The service is temporarily unavailable. Please retry in a moment.";
  }

  return error.message;
};
