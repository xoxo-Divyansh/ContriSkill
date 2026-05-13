import type { ApiErrorCode } from "@contriskill/contracts";

import { ApiClientError, type ApiEnvelopeError } from "./types";

const knownApiErrorCodes: readonly ApiErrorCode[] = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "STATE_CONFLICT",
  "RATE_LIMITED",
  "IDEMPOTENCY_CONFLICT",
  "MODERATION_LOCKED"
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isApiErrorCode = (value: string): value is ApiErrorCode => {
  return knownApiErrorCodes.includes(value as ApiErrorCode);
};

const isApiErrorEnvelope = (payload: unknown): payload is ApiEnvelopeError => {
  if (!isRecord(payload)) {
    return false;
  }

  const error = payload.error;
  if (!isRecord(error)) {
    return false;
  }

  return typeof error.code === "string" && typeof error.message === "string";
};

export const normalizeApiError = (status: number, payload: unknown): ApiClientError => {
  if (!isApiErrorEnvelope(payload)) {
    return new ApiClientError({
      kind: "invalid_response",
      code: "INVALID_RESPONSE",
      status,
      message: "API returned a non-standard error payload."
    });
  }

  const errorCode = isApiErrorCode(payload.error.code) ? payload.error.code : "UNKNOWN_API_ERROR";

  const input = {
    kind: "api",
    code: errorCode,
    status,
    message: payload.error.message
  } as const;

  if (payload.error.details) {
    return new ApiClientError({
      ...input,
      details: payload.error.details
    });
  }

  return new ApiClientError(input);
};

const isAbortLikeError = (error: unknown): boolean => {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
};

export const normalizeTransportError = (error: unknown, timedOut: boolean): ApiClientError => {
  if (timedOut) {
    return new ApiClientError({
      kind: "transport",
      code: "TRANSPORT_ERROR",
      message: "Request timed out before receiving a response.",
      transportErrorKind: "timeout",
      cause: error
    });
  }

  if (isAbortLikeError(error)) {
    return new ApiClientError({
      kind: "transport",
      code: "TRANSPORT_ERROR",
      message: "Request was aborted.",
      transportErrorKind: "aborted",
      cause: error
    });
  }

  return new ApiClientError({
    kind: "transport",
    code: "TRANSPORT_ERROR",
    message: "Network request failed.",
    transportErrorKind: "network",
    cause: error
  });
};
