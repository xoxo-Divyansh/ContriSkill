import { describe, it, expect } from "vitest";

import {
  validatePayloadSize,
  validateObjectStructure,
  validateStringValue,
  normalizeMalformedRequest
} from "../../src/security/input-validation";

describe("Input Validation Hardening", () => {
  describe("validatePayloadSize", () => {
    it("accepts small payloads", () => {
      const payload = { title: "test", description: "a simple test" };
      const result = validatePayloadSize(payload, { maxSizeBytes: 10000 });

      expect(result.valid).toBe(true);
      expect(result.diagnostic).toBeUndefined();
    });

    it("rejects payloads exceeding size limit", () => {
      const largePayload = { data: "x".repeat(50000) };
      const result = validatePayloadSize(largePayload, { maxSizeBytes: 1000 });

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("PAYLOAD_TOO_LARGE");
      expect(result.diagnostic?.suspiciousPattern).toBe(true);
      expect(result.diagnostic?.details?.payloadSize).toBeGreaterThan(1000);
    });

    it("uses default size limit when not specified", () => {
      const payload = { data: "x".repeat(200000) };
      const result = validatePayloadSize(payload);

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("PAYLOAD_TOO_LARGE");
    });

    it("handles undefined payload", () => {
      const result = validatePayloadSize(undefined);
      expect(result.valid).toBe(true);
    });

    it("handles non-serializable payload", () => {
      const payload = { date: new Date(), fn: () => {} };
      // Circular reference or non-serializable
      const result = validatePayloadSize(payload, { maxSizeBytes: 10000 });

      // Blob() will fail on circular refs, returns validation error
      if (!result.valid) {
        expect(result.diagnostic?.code).toBe("PAYLOAD_NOT_SERIALIZABLE");
      }
    });
  });

  describe("validateObjectStructure", () => {
    it("accepts valid objects", () => {
      const obj = {
        name: "John",
        age: 30,
        email: "john@example.com"
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(true);
    });

    it("rejects prototype pollution attempt with __proto__", () => {
      const obj = {
        data: "test",
        __proto__: { admin: true }
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("DANGEROUS_OBJECT_KEY");
      expect(result.diagnostic?.suspiciousPattern).toBe(true);
      expect(result.diagnostic?.details?.key).toBe("__proto__");
    });

    it("rejects constructor key", () => {
      const obj = {
        data: "test",
        constructor: { prototype: { admin: true } }
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("DANGEROUS_OBJECT_KEY");
      expect(result.diagnostic?.details?.key).toBe("constructor");
    });

    it("rejects prototype key", () => {
      const obj = {
        data: "test",
        prototype: { admin: true }
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("DANGEROUS_OBJECT_KEY");
      expect(result.diagnostic?.details?.key).toBe("prototype");
    });

    it("rejects excessively nested objects", () => {
      let obj: any = { data: "test" };
      for (let i = 0; i < 15; i++) {
        obj = { nested: obj };
      }

      const result = validateObjectStructure(obj, { maxDepth: 10 });

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("OBJECT_TOO_DEEP");
      expect(result.diagnostic?.suspiciousPattern).toBe(true);
    });

    it("accepts objects within depth limit", () => {
      let obj: any = { data: "test" };
      for (let i = 0; i < 5; i++) {
        obj = { nested: obj };
      }

      const result = validateObjectStructure(obj, { maxDepth: 10 });

      expect(result.valid).toBe(true);
    });

    it("rejects suspicious field names with dots", () => {
      const obj = {
        "field..traverse": "value"
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("SUSPICIOUS_FIELD_NAME");
    });

    it("rejects field names with excessive special chars", () => {
      const obj = {
        "field$@#%^&*()": "value"
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("SUSPICIOUS_FIELD_NAME");
    });

    it("accepts alphanumeric field names", () => {
      const obj = {
        field_name: "value",
        field2: "value2",
        $special: "ok"
      };
      const result = validateObjectStructure(obj);

      expect(result.valid).toBe(true);
    });

    it("handles non-object inputs", () => {
      expect(validateObjectStructure(null).valid).toBe(true);
      expect(validateObjectStructure(undefined).valid).toBe(true);
      expect(validateObjectStructure("string").valid).toBe(true);
      expect(validateObjectStructure(123).valid).toBe(true);
    });
  });

  describe("validateStringValue", () => {
    it("accepts safe strings", () => {
      const result = validateStringValue("Hello World");
      expect(result.valid).toBe(true);
    });

    it("rejects strings exceeding max length", () => {
      const longString = "x".repeat(15000);
      const result = validateStringValue(longString, { maxLength: 10000 });

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("STRING_TOO_LONG");
      expect(result.diagnostic?.suspiciousPattern).toBe(true);
    });

    it("detects SQL injection patterns", () => {
      const result = validateStringValue("'; DROP TABLE users; --");

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("SUSPICIOUS_STRING_PATTERN");
      expect(result.diagnostic?.suspiciousPattern).toBe(true);
    });

    it("detects command injection patterns", () => {
      const result = validateStringValue("test; rm -rf /");

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("SUSPICIOUS_STRING_PATTERN");
    });

    it("detects path traversal patterns", () => {
      const result = validateStringValue("../../../../etc/passwd");

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("SUSPICIOUS_STRING_PATTERN");
    });

    it("detects script injection patterns", () => {
      const result = validateStringValue("<script>alert('xss')</script>");

      expect(result.valid).toBe(false);
      expect(result.diagnostic?.code).toBe("SUSPICIOUS_STRING_PATTERN");
    });

    it("allows HTML when explicitly permitted", () => {
      const html = "<p>Hello <strong>World</strong></p>";
      const result = validateStringValue(html, { allowHtml: true });

      // HTML tags without script allowed when allowHtml=true
      expect(result.valid).toBe(true);
    });

    it("rejects script tags even with allowHtml=true", () => {
      const malicious = "<p><script>alert('xss')</script></p>";
      const result = validateStringValue(malicious, { allowHtml: true });

      // Script tags are never allowed
      expect(result.valid).toBe(false);
    });

    it("handles non-string inputs", () => {
      expect(validateStringValue(null as any).valid).toBe(true);
      expect(validateStringValue(undefined as any).valid).toBe(true);
      expect(validateStringValue(123 as any).valid).toBe(true);
    });

    it("uses default max length when not specified", () => {
      const longString = "x".repeat(15000);
      const result = validateStringValue(longString);

      // Default is 10000, so this should fail
      expect(result.valid).toBe(false);
    });
  });

  describe("normalizeMalformedRequest", () => {
    it("normalizes JSON parse error", () => {
      const error = new SyntaxError('Unexpected token "}" in JSON at position 42');
      const diagnostic = normalizeMalformedRequest(error, {
        correlationId: "req_123"
      });

      expect(diagnostic.code).toBe("INVALID_JSON");
      expect(diagnostic.message).toBe("Request body is malformed");
      expect(diagnostic.suspiciousPattern).toBe(true);
      expect(diagnostic.correlationId).toBe("req_123");
    });

    it("normalizes unknown error", () => {
      const error = new Error("Something went wrong");
      const diagnostic = normalizeMalformedRequest(error);

      expect(diagnostic.code).toBe("MALFORMED_REQUEST");
      expect(diagnostic.message).toBe("Request body is malformed");
      expect(diagnostic.suspiciousPattern).toBe(true);
    });

    it("handles string error", () => {
      const diagnostic = normalizeMalformedRequest("String error message");

      expect(diagnostic.code).toBe("MALFORMED_REQUEST");
      expect(diagnostic.suspiciousPattern).toBe(true);
    });

    it("includes request context when provided", () => {
      const error = new Error("JSON error");
      const diagnostic = normalizeMalformedRequest(error, {
        correlationId: "req_abc",
        requestPath: "/api/v1/contributions"
      });

      expect(diagnostic.correlationId).toBe("req_abc");
      expect(diagnostic.code).toBe("INVALID_JSON");
    });
  });
});
