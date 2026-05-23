import type { NextFunction, Request, Response } from "express";

import { createLogger, createIncidentId } from "../observability/logger";
const toMs = (start: bigint, end: bigint): number => Number(end - start) / 1_000_000;

const getRouteLabel = (request: Request): string => {
  return request.route?.path ? `${request.baseUrl}${request.route.path}` : request.originalUrl;
};

const isServerError = (statusCode: number): boolean => statusCode >= 500;
const isClientError = (statusCode: number): boolean => statusCode >= 400 && statusCode < 500;

export const createRequestLoggingMiddleware = (nodeEnv: string) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = request.requestStartedAt ?? process.hrtime.bigint();
    const logger = createLogger({
      correlationId: request.correlationId,
      method: request.method,
      route: request.originalUrl
    });

    logger.info("HTTP request started.");

    response.on("finish", () => {
      const elapsedMs = toMs(startedAt, process.hrtime.bigint());
      const route = getRouteLabel(request);

      const sharedContext = {
        statusCode: response.statusCode,
        elapsedMs: Number(elapsedMs.toFixed(2)),
        route
      };

      if (isServerError(response.statusCode)) {
        logger.error("HTTP request completed with server error.", {
          ...sharedContext,
          incidentId: createIncidentId()
        });
        return;
      }

      if (isClientError(response.statusCode)) {
        logger.warn("HTTP request completed with client error.", sharedContext);
        return;
      }

      if (nodeEnv !== "production") {
        logger.debug("HTTP request completed.", sharedContext);
      } else {
        logger.info("HTTP request completed.", sharedContext);
      }
    });

    next();
  };
};
