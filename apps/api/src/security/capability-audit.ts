import type { AuthCapability, AuthorizationErrorCode } from "../modules/auth/capabilities";
import type { RequestActor } from "../modules/auth/types";
import { log } from "../observability/logger";

/**
 * Centralized audit information for capability enforcement.
 *
 * Normalizes capability denial tracking for observability and compliance.
 */
export type CapabilityDenialEvent = {
  correlationId?: string;
  timestamp: string;
  actor: RequestActor;
  requiredCapability: AuthCapability;
  denyReason: "unauthenticated" | "insufficient_capability";
  requestPath?: string;
  requestMethod?: string;
  clientIp?: string;
};

/**
 * Audit result for capability enforcement.
 * Separates the authorization decision from the audit trail.
 */
export type CapabilityAuditResult = {
  allowed: boolean;
  errorCode: AuthorizationErrorCode;
  errorMessage: string;
  auditEvent?: CapabilityDenialEvent;
};

/**
 * Normalizes capability enforcement audit logging.
 *
 * Enables consistent tracking of:
 * - Authentication failures (unauthenticated attempts)
 * - Authorization failures (insufficient capability)
 * - Suspicious patterns (repeated failures from same actor)
 *
 * Returns normalized audit event that can be sent to observability pipeline.
 */
export const auditCapabilityDenial = (
  actor: RequestActor | undefined,
  requiredCapability: AuthCapability,
  isAuthenticated: boolean,
  options: {
    correlationId?: string;
    requestPath?: string;
    requestMethod?: string;
    clientIp?: string;
  } = {}
): CapabilityAuditResult => {
  const denyReason = isAuthenticated ? "insufficient_capability" : "unauthenticated";
  const errorCode: AuthorizationErrorCode = isAuthenticated ? "FORBIDDEN" : "UNAUTHENTICATED";
  const errorMessage =
    denyReason === "insufficient_capability"
      ? `Capability "${requiredCapability}" is required.`
      : "Authentication is required for this endpoint.";

  const auditEvent: CapabilityDenialEvent = {
    timestamp: new Date().toISOString(),
    actor: actor || {
      actorType: "anonymous",
      role: "public",
      sessionState: "anonymous"
    },
    requiredCapability,
    denyReason,
    ...(options.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
    ...(options.requestPath !== undefined ? { requestPath: options.requestPath } : {}),
    ...(options.requestMethod !== undefined ? { requestMethod: options.requestMethod } : {}),
    ...(options.clientIp !== undefined ? { clientIp: options.clientIp } : {})
  };

  // Log to observability pipeline
  log(
    denyReason === "insufficient_capability" ? "warn" : "info",
    `Capability enforcement denial: ${denyReason}`,
    {
      correlationId: options.correlationId,
      requiredCapability,
      denyReason,
      actorType: actor?.actorType,
      actorRole: actor?.role,
      sessionState: actor?.sessionState,
      requestPath: options.requestPath,
      requestMethod: options.requestMethod,
      clientIp: options.clientIp
    }
  );

  return {
    allowed: false,
    errorCode,
    errorMessage,
    auditEvent
  };
};

/**
 * Validates that a capability string matches expected format.
 *
 * Capabilities are in format: domain:action or domain:resource:action
 * e.g., "auth:login", "contribution:read", "admin:roles:manage"
 */
export const isValidCapabilityFormat = (capability: unknown): boolean => {
  if (typeof capability !== "string") {
    return false;
  }

  const parts = capability.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return false;
  }

  // Each part should be non-empty and alphanumeric/underscore
  return parts.every((part) => /^[a-z0-9_]+$/.test(part));
};

/**
 * Normalizes unauthorized/forbidden response structure for consistency.
 *
 * Ensures all authorization failures return consistent shape:
 * {
 *   error: {
 *     code: "UNAUTHENTICATED" | "FORBIDDEN",
 *     message: string
 *   },
 *   meta: {
 *     requestId: string,
 *     timestamp: string
 *   }
 * }
 */
export const buildAuthorizationErrorResponse = (
  auditResult: CapabilityAuditResult,
  requestId?: string
) => {
  return {
    error: {
      code: auditResult.errorCode,
      message: auditResult.errorMessage
    },
    ...(requestId
      ? {
          meta: {
            requestId,
            timestamp: new Date().toISOString()
          }
        }
      : {})
  };
};
