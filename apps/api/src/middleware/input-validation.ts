import type { NextFunction, Request, Response } from "express";

import { log } from "../observability/logger";
import { validateObjectStructure, validatePayloadSize } from "../security/input-validation";

/**
 * Middleware for defensive input validation on API payloads.
 *
 * Validates:
 * - Payload size limits
 * - Object structure safety (no prototype pollution, reasonable nesting)
 * - Malformed JSON handling
 *
 * Does NOT validate specific endpoint schemas - that's done by route handlers.
 * This middleware is a catch-all for common attacks at the HTTP boundary.
 */
export const createInputValidationMiddleware = (
  options: {
    maxPayloadSizeBytes?: number;
    maxObjectDepth?: number;
  } = {}
) => {
  return (request: Request, response: Response, next: NextFunction): void => {
    // Only validate request methods that typically have bodies
    if (!["POST", "PUT", "PATCH"].includes(request.method)) {
      next();
      return;
    }

    // Validate payload size
    const payloadSizeOptions: {
      maxSizeBytes: number;
      correlationId?: string;
    } = {
      maxSizeBytes: options.maxPayloadSizeBytes ?? 1024 * 100
    };

    if (request.correlationId !== undefined) {
      payloadSizeOptions.correlationId = request.correlationId;
    }

    const sizeResult = validatePayloadSize(request.body, payloadSizeOptions);

    if (!sizeResult.valid && sizeResult.diagnostic) {
      log("warn", "Request validation failed: payload size", {
        correlationId: request.correlationId,
        requestPath: request.path,
        code: sizeResult.diagnostic.code,
        details: sizeResult.diagnostic.details
      });

      response.status(400).json({
        error: {
          code: sizeResult.diagnostic.code,
          message: sizeResult.diagnostic.message
        },
        meta: {
          requestId: request.correlationId,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Validate object structure
    const objectStructureOptions: {
      maxDepth: number;
      allowUnknownFields: boolean;
      correlationId?: string;
    } = {
      maxDepth: options.maxObjectDepth ?? 10,
      allowUnknownFields: true
    };

    if (request.correlationId !== undefined) {
      objectStructureOptions.correlationId = request.correlationId;
    }

    const structureResult = validateObjectStructure(request.body, objectStructureOptions);

    if (!structureResult.valid && structureResult.diagnostic) {
      log("warn", "Request validation failed: object structure", {
        correlationId: request.correlationId,
        requestPath: request.path,
        code: structureResult.diagnostic.code,
        suspiciousPattern: structureResult.diagnostic.suspiciousPattern,
        details: structureResult.diagnostic.details
      });

      response.status(400).json({
        error: {
          code: structureResult.diagnostic.code,
          message: structureResult.diagnostic.message
        },
        meta: {
          requestId: request.correlationId,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    next();
  };
};
