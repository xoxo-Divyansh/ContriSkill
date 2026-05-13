export const apiErrorCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "STATE_CONFLICT",
  "RATE_LIMITED",
  "IDEMPOTENCY_CONFLICT",
  "MODERATION_LOCKED"
] as const;

export type ApiErrorCode = (typeof apiErrorCodes)[number];
