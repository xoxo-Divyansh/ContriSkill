import type { NextFunction, Request, Response } from "express";

import { log } from "../observability/logger";
import { extractRateLimitKey, type RateLimiter } from "../security/rate-limiter";

/**
 * Middleware factory for route-class rate limiting.
 *
 * Applies rate limiting based on policy and request context.
 * Returns appropriate headers and error responses when rate limited.
 */
export const createRateLimitMiddleware = (
  rateLimiter: RateLimiter,
  policyName: string,
  options: {
    getKey?: (request: Request) => string;
  } = {}
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const rateLimitKeyOptions: {
      authenticated?: boolean;
      sessionId?: string;
      clientIp?: string;
    } = {
      authenticated: request.actor?.actorType === "authenticated"
    };

    if (request.actor?.userId !== undefined) {
      rateLimitKeyOptions.sessionId = request.actor.userId;
    }

    if (request.ip !== undefined) {
      rateLimitKeyOptions.clientIp = request.ip;
    }

    const key = options.getKey?.(request) ?? extractRateLimitKey(rateLimitKeyOptions);

    const rateLimitContext: {
      correlationId?: string;
      requestPath: string;
    } = {
      requestPath: request.path
    };

    if (request.correlationId !== undefined) {
      rateLimitContext.correlationId = request.correlationId;
    }

    const checkResult = rateLimiter.check(policyName, key, rateLimitContext);

    // Add rate-limit headers to response
    if (checkResult.remaining !== undefined) {
      response.setHeader("X-RateLimit-Remaining", checkResult.remaining.toString());
    }

    if (checkResult.resetAfterSeconds !== undefined) {
      response.setHeader("X-RateLimit-Reset", checkResult.resetAfterSeconds.toString());
    }

    if (!checkResult.allowed) {
      // Rate limited
      if (checkResult.retryAfter !== undefined) {
        response.setHeader("Retry-After", checkResult.retryAfter.toString());
      }

      log("info", "Request rate-limited", {
        correlationId: request.correlationId,
        requestPath: request.path,
        policy: policyName,
        retryAfter: checkResult.retryAfter
      });

      response.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please retry later."
        },
        meta: {
          requestId: request.correlationId,
          timestamp: new Date().toISOString(),
          retryAfter: checkResult.retryAfter
        }
      });
      return;
    }

    next();
  };
};
