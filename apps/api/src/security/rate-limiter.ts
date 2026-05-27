import { log } from "../observability/logger";

/**
 * Rate limit window and counter for a key (e.g., IP, user ID, session).
 */
type RateLimitEntry = {
  count: number;
  windowStart: number;
};

/**
 * Configuration for a rate-limit policy per route class.
 */
export type RateLimitPolicy = {
  /**
   * Number of requests allowed per window.
   */
  maxRequests: number;

  /**
   * Window duration in seconds.
   */
  windowSeconds: number;

  /**
   * Human-readable name for logging.
   */
  name: string;

  /**
   * Whether to include retry-after header in response.
   */
  includeRetryAfter?: boolean;
};

/**
 * Result of rate-limit check.
 */
export type RateLimitCheckResult = {
  allowed: boolean;
  remaining?: number;
  resetAfterSeconds?: number;
  retryAfter?: number;
};

/**
 * Lightweight in-memory rate limiter foundation.
 *
 * This is intentionally simple and does NOT persist across restarts.
 * It's designed for single-process MVP usage and demonstrates the
 * rate-limiting pattern. For distributed systems, replace with Redis-backed
 * or similar persistent solution.
 *
 * Strategy:
 * - Keeps a map of key -> { count, windowStart }
 * - On check, if window has expired, reset counter
 * - If under limit, increment and allow
 * - If over limit, reject with retry-after
 *
 * This foundation supports:
 * - Auth endpoint protection (register, login, refresh)
 * - Mutation endpoint protection (contribution, mutation, draft operations)
 * - Realtime handshake protection
 * - Public read endpoints (lightweight)
 */
export class RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly policies: Map<string, RateLimitPolicy>;

  constructor(policies: Record<string, RateLimitPolicy>) {
    this.policies = new Map(Object.entries(policies));
  }

  /**
   * Checks if a request should be allowed under the given policy.
   *
   * Returns result with rate-limit metadata that can be added to response headers:
   * - X-RateLimit-Limit: max requests
   * - X-RateLimit-Remaining: requests left in window
   * - X-RateLimit-Reset: unix timestamp when window resets
   * - Retry-After: seconds to wait (if rate-limited)
   */
  check(
    policyName: string,
    key: string,
    options: {
      correlationId?: string;
      requestPath?: string;
    } = {}
  ): RateLimitCheckResult {
    const policy = this.policies.get(policyName);
    if (!policy) {
      // Unknown policy - allow and log warning
      log("warn", "Unknown rate-limit policy", {
        correlationId: options.correlationId,
        policy: policyName,
        requestPath: options.requestPath
      });

      return { allowed: true };
    }

    const now = Date.now();
    const windowMillis = policy.windowSeconds * 1000;
    const entry = this.entries.get(key) ?? { count: 0, windowStart: now };

    // Check if window has expired
    if (now - entry.windowStart > windowMillis) {
      // Window expired, reset
      entry.count = 0;
      entry.windowStart = now;
    }

    // Check if already at limit (before incrementing)
    if (entry.count >= policy.maxRequests) {
      // Rate limited
      const resetAfterSeconds = Math.ceil((entry.windowStart + windowMillis - now) / 1000);

      log("info", `Rate limit exceeded for policy ${policy.name}`, {
        correlationId: options.correlationId,
        policy: policyName,
        requestPath: options.requestPath,
        key: this.hashKey(key), // Don't log full key for privacy
        count: entry.count,
        maxRequests: policy.maxRequests
      });

      return {
        allowed: false,
        remaining: 0,
        resetAfterSeconds,
        retryAfter: resetAfterSeconds
      };
    }

    // Allow: increment count first, then calculate remaining
    entry.count += 1;
    this.entries.set(key, entry);

    // remaining reflects quota left AFTER this request is counted
    const remaining = Math.max(0, policy.maxRequests - entry.count);
    const resetAfterSeconds = Math.ceil((entry.windowStart + windowMillis - now) / 1000);

    return {
      allowed: true,
      remaining,
      resetAfterSeconds
    };
  }

  /**
   * Clears all rate-limit entries. Useful for testing and graceful shutdown.
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Gets current entries count. Useful for monitoring.
   */
  getMetrics() {
    return {
      trackedKeys: this.entries.size,
      policies: Array.from(this.policies.values()).map((p) => ({
        name: p.name,
        maxRequests: p.maxRequests,
        windowSeconds: p.windowSeconds
      }))
    };
  }

  /**
   * Simple hash of key for logging (doesn't need to be secure, just distinctive).
   */
  private hashKey(key: string): string {
    const hash = key.split("").reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);
    return `hash_${Math.abs(hash).toString(16).slice(-8)}`;
  }
}

/**
 * Standard rate-limit policies for route classes.
 *
 * These are MVP-level policies designed for development/small-scale operation.
 * Adjust based on monitoring and production traffic patterns.
 */
export const getStandardRateLimitPolicies = (
  env: "development" | "production"
): Record<string, RateLimitPolicy> => {
  const isDev = env === "development";

  return {
    // Auth endpoints: lower limits, more restrictive
    auth: {
      maxRequests: isDev ? 100 : 10,
      windowSeconds: isDev ? 60 : 300,
      name: "auth_endpoints",
      includeRetryAfter: true
    },

    // Mutation endpoints: moderate limits
    mutation: {
      maxRequests: isDev ? 1000 : 100,
      windowSeconds: isDev ? 60 : 60,
      name: "mutation_endpoints",
      includeRetryAfter: true
    },

    // Realtime handshake: moderate limits
    realtime: {
      maxRequests: isDev ? 500 : 50,
      windowSeconds: isDev ? 60 : 60,
      name: "realtime_handshake",
      includeRetryAfter: true
    },

    // Public read endpoints: generous limits
    public_read: {
      maxRequests: isDev ? 5000 : 1000,
      windowSeconds: isDev ? 60 : 60,
      name: "public_read",
      includeRetryAfter: false
    }
  };
};

/**
 * Extracts rate-limit key from request.
 *
 * For MVP, uses:
 * - Session ID if authenticated
 * - Client IP if anonymous
 *
 * This prevents one user from monopolizing quota while allowing
 * multiple users behind same proxy to share quota fairly.
 */
export const extractRateLimitKey = (options: {
  authenticated?: boolean;
  sessionId?: string;
  clientIp?: string;
}): string => {
  if (options.authenticated && options.sessionId) {
    return `session_${options.sessionId}`;
  }

  if (options.clientIp) {
    return `ip_${options.clientIp}`;
  }

  return "unknown_key";
};
