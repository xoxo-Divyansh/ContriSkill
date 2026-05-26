import type { Request } from "express";

import { log } from "./logger";

export type SecurityEventKind =
  | "auth_failure"
  | "capability_denied"
  | "rate_limit_exceeded"
  | "suspicious_request"
  | "malformed_request";

const getClientIp = (request: Request): string | undefined => {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim().length > 0) {
    return forwarded.split(",")[0]?.trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]?.trim();
  }
  return request.ip;
};

export const emitSecurityEvent = (
  kind: SecurityEventKind,
  request: Request,
  details: Record<string, unknown> = {}
): void => {
  log("warn", `Security event: ${kind}`, {
    kind,
    method: request.method,
    path: request.path,
    ip: getClientIp(request),
    userAgent: request.headers["user-agent"],
    actorType: request.actor?.actorType ?? "unknown",
    actorRole: request.actor?.role ?? "unknown",
    ...details
  });
};
