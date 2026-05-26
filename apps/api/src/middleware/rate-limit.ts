import type { NextFunction, Request, Response } from "express";

import { emitSecurityEvent } from "../observability/security-events";

import { sendSecurityError } from "./security-response";

type Bucket = { count: number; resetAtMs: number };

const buckets = new Map<string, Bucket>();

const windowMs = 60_000;
const defaultLimit = 120;
const strictAuthLimit = 30;
const strictAuthPaths = new Set(["/api/v1/auth/login", "/api/v1/auth/refresh"]);

const getClientKey = (request: Request): string => {
  const ip = request.ip ?? "unknown";
  return `${ip}:${request.path}`;
};

const getLimit = (request: Request): number => {
  return strictAuthPaths.has(request.path) ? strictAuthLimit : defaultLimit;
};

export const rateLimitMiddleware = (request: Request, response: Response, next: NextFunction): void => {
  const now = Date.now();
  const key = getClientKey(request);
  const limit = getLimit(request);
  const existing = buckets.get(key);

  if (!existing || existing.resetAtMs <= now) {
    buckets.set(key, { count: 1, resetAtMs: now + windowMs });
    next();
    return;
  }

  if (existing.count >= limit) {
    emitSecurityEvent("rate_limit_exceeded", request, {
      key,
      limit,
      windowMs
    });
    response.setHeader("Retry-After", Math.ceil((existing.resetAtMs - now) / 1000).toString());
    sendSecurityError(response, 429, "RATE_LIMITED", "Too many requests. Please retry later.");
    return;
  }

  existing.count += 1;
  next();
};

export const resetRateLimitStateForTests = (): void => {
  buckets.clear();
};
