import { log } from "../observability/logger";

/**
 * Validation error diagnostic information.
 *
 * Separates technical validation failure from user-facing message.
 */
export type ValidationDiagnostic = {
  code: string;
  message: string;
  correlationId?: string;
  suspiciousPattern?: boolean;
  details?: Record<string, unknown>;
};

/**
 * Result of defensive input validation.
 * Always returns without throwing to enable proper error handling.
 */
export type ValidationResult = {
  valid: boolean;
  diagnostic?: ValidationDiagnostic;
};

/**
 * Safely attaches optional correlation ID only when defined.
 *
 * Required because:
 * - exactOptionalPropertyTypes=true
 * - optional properties cannot explicitly receive undefined
 */
const buildDiagnostic = (
  diagnostic: Omit<ValidationDiagnostic, "correlationId">,
  correlationId?: string
): ValidationDiagnostic => {
  if (!correlationId) {
    return diagnostic;
  }

  return {
    ...diagnostic,
    correlationId
  };
};

/**
 * Defensively validates JSON payload size.
 *
 * Prevents:
 * - Memory exhaustion from enormous payloads
 * - Denial of service from streaming large files
 * - Buffer overflow scenarios
 *
 * Limits are conservative and based on typical API use cases.
 */
export const validatePayloadSize = (
  payload: unknown,
  options: {
    maxSizeBytes?: number;
    correlationId?: string;
  } = {}
): ValidationResult => {
  const maxSize = options.maxSizeBytes ?? 1024 * 100; // 100KB default

  if (!payload) {
    return { valid: true };
  }

  /**
   * Estimate payload size safely.
   *
   * If stringify fails:
   * - circular structure
   * - malformed payload
   * - serialization failure
   */
  let payloadSize = 0;

  try {
    payloadSize = new Blob([JSON.stringify(payload)]).size;
  } catch {
    return {
      valid: false,
      diagnostic: buildDiagnostic(
        {
          code: "PAYLOAD_NOT_SERIALIZABLE",
          message: "Request body could not be parsed as JSON",
          suspiciousPattern: true
        },
        options.correlationId
      )
    };
  }

  if (payloadSize > maxSize) {
    log("warn", "Request payload exceeds size limit", {
      correlationId: options.correlationId,
      payloadSize,
      maxSize,
      suspiciousPattern: true
    });

    return {
      valid: false,
      diagnostic: buildDiagnostic(
        {
          code: "PAYLOAD_TOO_LARGE",
          message: `Request body exceeds maximum size of ${maxSize} bytes`,
          suspiciousPattern: true,
          details: { payloadSize, maxSize }
        },
        options.correlationId
      )
    };
  }

  return { valid: true };
};

/**
 * Defensively validates object structure and field names.
 *
 * Prevents:
 * - Prototype pollution
 * - Unexpected fields that could bypass validation
 * - Deeply nested objects that could cause stack overflow
 * - Field name injection attacks
 */
export const validateObjectStructure = (
  obj: unknown,
  options: {
    maxDepth?: number;
    allowUnknownFields?: boolean;
    correlationId?: string;
  } = {}
): ValidationResult => {
  const maxDepth = options.maxDepth ?? 10;

  if (!obj || typeof obj !== "object") {
    return { valid: true };
  }

  /**
   * Detect prototype manipulation attempts.
   *
   * __proto__ attacks often mutate prototype chain
   * without appearing in Object.keys().
   */
  const prototype = Object.getPrototypeOf(obj);

  if (
    prototype &&
    prototype !== Object.prototype &&
    prototype !== Array.prototype
  ) {
    return {
      valid: false,
      diagnostic: buildDiagnostic(
        {
          code: "DANGEROUS_OBJECT_KEY",
          message: "Request contains forbidden field name",
          suspiciousPattern: true,
          details: { key: "__proto__" }
        },
        options.correlationId
      )
    };
  }

  /**
   * Explicit dangerous field names.
   */
  const dangerousKeys = ["__proto__", "constructor", "prototype"];

  const objKeys = Object.keys(obj);

  for (const key of objKeys) {
    if (dangerousKeys.includes(key)) {
      log("warn", "Object contains dangerous key", {
        correlationId: options.correlationId,
        key,
        suspiciousPattern: true
      });

      return {
        valid: false,
        diagnostic: buildDiagnostic(
          {
            code: "DANGEROUS_OBJECT_KEY",
            message: "Request contains forbidden field name",
            suspiciousPattern: true,
            details: { key }
          },
          options.correlationId
        )
      };
    }

    /**
     * Detect suspicious field traversal patterns.
     *
     * Examples:
     * - field..traverse
     * - excessive special chars
     */
    const specialCharCount =
      (key.match(/[^a-zA-Z0-9_$]/g)?.length) ?? 0;

    if (key.includes("..") || specialCharCount > 5) {
      log("warn", "Object contains suspicious field name", {
        correlationId: options.correlationId,
        key,
        suspiciousPattern: true
      });

      return {
        valid: false,
        diagnostic: buildDiagnostic(
          {
            code: "SUSPICIOUS_FIELD_NAME",
            message: "Request contains suspicious field name",
            suspiciousPattern: true,
            details: { key }
          },
          options.correlationId
        )
      };
    }
  }

  /**
   * Recursively validate nesting depth.
   *
   * Prevents:
   * - stack exhaustion
   * - recursive parser abuse
   * - deeply nested attack payloads
   */
  const checkDepth = (
    value: unknown,
    depth: number
  ): boolean => {
    if (depth > maxDepth) {
      return false;
    }

    if (typeof value !== "object" || value === null) {
      return true;
    }

    const values = Array.isArray(value)
      ? value
      : Object.values(value);

    return values.every((nestedValue) =>
      checkDepth(nestedValue, depth + 1)
    );
  };

  if (!checkDepth(obj, 0)) {
    log("warn", "Object structure exceeds maximum depth", {
      correlationId: options.correlationId,
      maxDepth,
      suspiciousPattern: true
    });

    return {
      valid: false,
      diagnostic: buildDiagnostic(
        {
          code: "OBJECT_TOO_DEEP",
          message: `Request structure exceeds maximum nesting depth of ${maxDepth}`,
          suspiciousPattern: true,
          details: { maxDepth }
        },
        options.correlationId
      )
    };
  }

  return { valid: true };
};

/**
 * Defensively validates string values against common injection patterns.
 *
 * Prevents:
 * - SQL injection (basic pattern detection)
 * - Command injection
 * - Path traversal
 * - Script injection (very basic)
 *
 * Note:
 * This is supplementary protection only.
 * Still use:
 * - parameterized queries
 * - escaping
 * - output sanitization
 */
export const validateStringValue = (
  value: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    correlationId?: string;
  } = {}
): ValidationResult => {
  const maxLength = options.maxLength ?? 10000;
  const allowHtml = options.allowHtml ?? false;

  if (!value || typeof value !== "string") {
    return { valid: true };
  }

  if (value.length > maxLength) {
    log("warn", "String value exceeds maximum length", {
      correlationId: options.correlationId,
      length: value.length,
      maxLength,
      suspiciousPattern: true
    });

    return {
      valid: false,
      diagnostic: buildDiagnostic(
        {
          code: "STRING_TOO_LONG",
          message: `String value exceeds maximum length of ${maxLength}`,
          suspiciousPattern: true,
          details: {
            length: value.length,
            maxLength
          }
        },
        options.correlationId
      )
    };
  }

  /**
   * Basic suspicious input patterns.
   *
   * These are intentionally conservative and
   * should NOT replace real escaping/sanitization.
   */
  const suspiciousPatterns = [
    /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)/i,
    /[;&|`$()]/g,
    /\.\.[/\\]/g,
    /<script|javascript:|on\w+=/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(value)) {
      /**
       * HTML content may be legitimate in some fields.
       * Skip generic HTML/script pattern rejection
       * only when explicitly allowed.
       */
      if (allowHtml && pattern.source.includes("script")) {
        continue;
      }

      log("warn", "String value contains suspicious pattern", {
        correlationId: options.correlationId,
        pattern: pattern.source,
        suspiciousPattern: true
      });

      return {
        valid: false,
        diagnostic: buildDiagnostic(
          {
            code: "SUSPICIOUS_STRING_PATTERN",
            message: "Request contains suspicious string pattern",
            suspiciousPattern: true,
            details: {
              pattern: pattern.source
            }
          },
          options.correlationId
        )
      };
    }
  }

  return { valid: true };
};

/**
 * Normalizes malformed requests into safe diagnostics.
 *
 * Prevents:
 * - leaking parser internals
 * - exposing runtime details
 * - inconsistent malformed request handling
 */
export const normalizeMalformedRequest = (
  error: unknown,
  options: {
    correlationId?: string;
    requestPath?: string;
  } = {}
): ValidationDiagnostic => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown error";

  const isJsonParseError =
    message.includes("JSON") ||
    message.includes("Unexpected");

  log("info", "Malformed request detected", {
    correlationId: options.correlationId,
    requestPath: options.requestPath,
    errorType: isJsonParseError ? "json_parse" : "unknown",
    suspiciousPattern: true
  });

  return buildDiagnostic(
    {
      code: isJsonParseError
        ? "INVALID_JSON"
        : "MALFORMED_REQUEST",
      message: "Request body is malformed",
      suspiciousPattern: true
    },
    options.correlationId
  );
};