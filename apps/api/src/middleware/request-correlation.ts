import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export const requestIdHeaderName = "x-request-id";

const normalizeRequestId = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) {
    return undefined;
  }
  const trimmed = candidate.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    return undefined;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
};

const now = (): bigint => process.hrtime.bigint();

declare module "express-serve-static-core" {
  interface Request {
    correlationId?: string;
    requestStartedAt?: bigint;
  }
}

export const createRequestCorrelationMiddleware = () => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const incoming = normalizeRequestId(request.headers[requestIdHeaderName]);
    const correlationId = incoming ?? `req_${randomUUID()}`;
    const requestStartedAt = now();

    request.correlationId = correlationId;
    request.requestStartedAt = requestStartedAt;

    response.setHeader(requestIdHeaderName, correlationId);
    next();
  };
};
