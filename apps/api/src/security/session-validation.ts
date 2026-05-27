import type { AuthSessionRecord, RequestActor } from "../modules/auth/types";
import { log } from "../observability/logger";

/**
 * Session validation result with detailed diagnostics for security hardening.
 *
 * Separates successful validation from various failure modes to enable
 * proper error handling, audit logging, and progressive security improvements.
 */
export type SessionValidationResult = {
  valid: boolean;
  actor: RequestActor;
  diagnostics?: {
    reason: string;
    riskLevel: "low" | "medium" | "high";
    suspicious: boolean;
  };
};

/**
 * Defensively validates a session record and converts to RequestActor.
 *
 * Handles:
 * - Expired sessions
 * - Revoked sessions
 * - Invalid state transitions
 * - Malformed records
 * - Missing required fields
 *
 * Returns a result object with diagnostics to enable security logging
 * and audit trail generation without throwing exceptions at this layer.
 */
export const validateSessionRecord = (
  session: AuthSessionRecord | undefined,
  options: {
    correlationId?: string;
    requestPath?: string;
    clientIp?: string;
  } = {}
): SessionValidationResult => {
  // Handle null/undefined session
  if (!session) {
    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "anonymous"
      },
      diagnostics: {
        reason: "session_not_found",
        riskLevel: "low",
        suspicious: false
      }
    };
  }

  // Validate required fields
  const hasRequiredFields = Boolean(
    session.id &&
    session.userId &&
    session.role &&
    session.state &&
    session.issuedAt &&
    session.expiresAt
  );

  if (!hasRequiredFields) {
    log("warn", "Session record has missing required fields", {
      correlationId: options.correlationId,
      sessionId: session.id,
      hasUserId: Boolean(session.userId),
      hasRole: Boolean(session.role),
      hasState: Boolean(session.state),
      riskLevel: "high"
    });

    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "anonymous"
      },
      diagnostics: {
        reason: "malformed_session_record",
        riskLevel: "high",
        suspicious: true
      }
    };
  }

  // Check if session is revoked
  if (session.revokedAt) {
    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "expired"
      },
      diagnostics: {
        reason: "session_revoked",
        riskLevel: "low",
        suspicious: false
      }
    };
  }

  // Check if session is expired
  const expiresAt = new Date(session.expiresAt).getTime();
  const now = Date.now();
  if (expiresAt <= now) {
    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "expired"
      },
      diagnostics: {
        reason: "session_expired",
        riskLevel: "low",
        suspicious: false
      }
    };
  }

  // Validate session state machine
  if (session.state !== "authenticated") {
    log("warn", "Session in unexpected state", {
      correlationId: options.correlationId,
      sessionId: session.id,
      state: session.state,
      riskLevel: "medium"
    });

    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "expired"
      },
      diagnostics: {
        reason: "invalid_session_state",
        riskLevel: "medium",
        suspicious: true
      }
    };
  }

  // Validate timestamps are coherent
  const issuedAt = new Date(session.issuedAt).getTime();
  const lastSeenAt = new Date(session.lastSeenAt).getTime();

  if (issuedAt > now || issuedAt > expiresAt) {
    log("warn", "Session has incoherent timestamps", {
      correlationId: options.correlationId,
      sessionId: session.id,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
      now: new Date(now).toISOString(),
      riskLevel: "high"
    });

    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "expired"
      },
      diagnostics: {
        reason: "invalid_session_timestamps",
        riskLevel: "high",
        suspicious: true
      }
    };
  }

  if (lastSeenAt > now + 60000) {
    // Allow 60s clock skew
    log("warn", "Session last_seen_at in the future", {
      correlationId: options.correlationId,
      sessionId: session.id,
      lastSeenAt: session.lastSeenAt,
      now: new Date(now).toISOString(),
      riskLevel: "medium"
    });

    return {
      valid: false,
      actor: {
        actorType: "anonymous",
        role: "public",
        sessionState: "expired"
      },
      diagnostics: {
        reason: "suspicious_last_seen_timestamp",
        riskLevel: "medium",
        suspicious: true
      }
    };
  }

  // Session is valid - convert to actor
  return {
    valid: true,
    actor: {
      actorType: "authenticated",
      role: session.role,
      sessionState: "authenticated",
      userId: session.userId
    }
  };
};

/**
 * Validates a session token format defensively.
 *
 * Returns true only if token matches expected opaque token format (prefix_uuid).
 * Doesn't validate cryptographic properties, just format safety.
 */
export const isValidTokenFormat = (
  token: string | undefined
): token is string => {
  if (typeof token !== "string") {
    return false;
  }

  if (token.length === 0) {
    return false;
  }

  if (token !== token.trim()) {
    return false;
  }

  if (token.length < 35 || token.length > 50) {
    return false;
  }

  const parts = token.split("_");

  if (parts.length !== 2) {
    return false;
  }

  const prefix = parts[0];
  const uuid = parts[1];

  if (!prefix || !uuid) {
    return false;
  }

  if (prefix !== "atk" && prefix !== "rtk") {
    return false;
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidPattern.test(uuid);
};
