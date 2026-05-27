import { describe, expect, it } from "vitest";

import type { RequestActor } from "../../src/modules/auth/types";
import {
    auditCapabilityDenial,
    buildAuthorizationErrorResponse,
    isValidCapabilityFormat
} from "../../src/security/capability-audit";

describe("Capability Audit Hardening", () => {
  describe("auditCapabilityDenial", () => {
    it("audits unauthenticated capability denial", () => {
      const result = auditCapabilityDenial(
        {
          actorType: "anonymous",
          role: "public",
          sessionState: "anonymous"
        },
        "contribution:create",
        false, // not authenticated
        {
          correlationId: "req_123",
          requestPath: "/api/v1/contributions",
          requestMethod: "POST",
          clientIp: "192.168.1.1"
        }
      );

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("UNAUTHENTICATED");
      expect(result.errorMessage).toContain("Authentication is required");
      expect(result.auditEvent).toBeDefined();
      expect(result.auditEvent?.denyReason).toBe("unauthenticated");
      expect(result.auditEvent?.requiredCapability).toBe("contribution:create");
      expect(result.auditEvent?.correlationId).toBe("req_123");
      expect(result.auditEvent?.clientIp).toBe("192.168.1.1");
    });

    it("audits insufficient capability denial", () => {
      const actor: RequestActor = {
        actorType: "authenticated",
        role: "user",
        sessionState: "authenticated",
        userId: "user_123"
      };

      const result = auditCapabilityDenial(actor, "moderation:case:write", true);

      expect(result.allowed).toBe(false);
      expect(result.errorCode).toBe("FORBIDDEN");
      expect(result.errorMessage).toContain('Capability "moderation:case:write" is required');
      expect(result.auditEvent?.denyReason).toBe("insufficient_capability");
      expect(result.auditEvent?.actor).toEqual(actor);
    });

    it("includes full audit event details", () => {
      const result = auditCapabilityDenial(
        {
          actorType: "authenticated",
          role: "user",
          sessionState: "authenticated",
          userId: "user_123"
        },
        "admin:roles:manage",
        true,
        {
          correlationId: "req_xyz",
          requestPath: "/api/v1/admin/roles",
          requestMethod: "POST",
          clientIp: "10.0.0.1"
        }
      );

      const event = result.auditEvent;
      expect(event).toBeDefined();
      expect(event?.timestamp).toBeTruthy();
      expect(event?.actor.userId).toBe("user_123");
      expect(event?.requiredCapability).toBe("admin:roles:manage");
      expect(event?.denyReason).toBe("insufficient_capability");
      expect(event?.requestPath).toBe("/api/v1/admin/roles");
      expect(event?.requestMethod).toBe("POST");
      expect(event?.clientIp).toBe("10.0.0.1");
    });

    it("handles undefined actor gracefully", () => {
      const result = auditCapabilityDenial(undefined, "contribution:read", false, {
        correlationId: "req_abc"
      });

      expect(result.allowed).toBe(false);
      expect(result.auditEvent?.actor.actorType).toBe("anonymous");
      expect(result.auditEvent?.actor.role).toBe("public");
    });
  });

  describe("buildAuthorizationErrorResponse", () => {
    it("builds 401 response for unauthenticated", () => {
      const auditResult = {
        allowed: false,
        errorCode: "UNAUTHENTICATED" as const,
        errorMessage: "Authentication is required"
      };

      const response = buildAuthorizationErrorResponse(auditResult, "req_123");

      expect(response.error.code).toBe("UNAUTHENTICATED");
      expect(response.error.message).toBe("Authentication is required");
      expect(response.meta).toBeDefined();
      expect(response.meta?.requestId).toBe("req_123");
      expect(response.meta?.timestamp).toBeTruthy();
    });

    it("builds 403 response for forbidden", () => {
      const auditResult = {
        allowed: false,
        errorCode: "FORBIDDEN" as const,
        errorMessage: 'Capability "admin:roles:manage" is required.'
      };

      const response = buildAuthorizationErrorResponse(auditResult, "req_def");

      expect(response.error.code).toBe("FORBIDDEN");
      expect(response.error.message).toContain("admin:roles:manage");
      expect(response.meta).toBeDefined();
      expect(response.meta?.requestId).toBe("req_def");
    });

    it("builds response without requestId", () => {
      const auditResult = {
        allowed: false,
        errorCode: "FORBIDDEN" as const,
        errorMessage: "Insufficient permissions"
      };

      const response = buildAuthorizationErrorResponse(auditResult);

      expect(response.error.code).toBe("FORBIDDEN");
      expect(response.error.message).toBe("Insufficient permissions");
      expect(response.meta).toBeUndefined();
    });
  });

  describe("isValidCapabilityFormat", () => {
    it("accepts valid two-part capability", () => {
      expect(isValidCapabilityFormat("auth:login")).toBe(true);
      expect(isValidCapabilityFormat("contribution:read")).toBe(true);
      expect(isValidCapabilityFormat("admin:delete")).toBe(true);
    });

    it("accepts valid three-part capability", () => {
      expect(isValidCapabilityFormat("moderation:case:write")).toBe(true);
      expect(isValidCapabilityFormat("admin:roles:manage")).toBe(true);
      expect(isValidCapabilityFormat("contribution:application:accept")).toBe(true);
    });

    it("accepts underscores in capability names", () => {
      expect(isValidCapabilityFormat("auth:session_read")).toBe(true);
      expect(isValidCapabilityFormat("contribution_deletion:execute")).toBe(true);
    });

    it("accepts numbers in capability names", () => {
      expect(isValidCapabilityFormat("api_v2:read")).toBe(true);
      expect(isValidCapabilityFormat("resource:action123")).toBe(true);
    });

    it("rejects single-part capability", () => {
      expect(isValidCapabilityFormat("login")).toBe(false);
    });

    it("rejects four-part capability", () => {
      expect(isValidCapabilityFormat("a:b:c:d")).toBe(false);
    });

    it("rejects uppercase", () => {
      expect(isValidCapabilityFormat("Auth:Login")).toBe(false);
      expect(isValidCapabilityFormat("ADMIN:ROLES:MANAGE")).toBe(false);
    });

    it("rejects special characters", () => {
      expect(isValidCapabilityFormat("auth-login")).toBe(false);
      expect(isValidCapabilityFormat("auth.login")).toBe(false);
      expect(isValidCapabilityFormat("auth login")).toBe(false);
    });

    it("rejects empty parts", () => {
      expect(isValidCapabilityFormat("auth:")).toBe(false);
      expect(isValidCapabilityFormat(":login")).toBe(false);
      expect(isValidCapabilityFormat("auth::login")).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidCapabilityFormat(undefined)).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isValidCapabilityFormat(123 as any)).toBe(false);
      expect(isValidCapabilityFormat({} as any)).toBe(false);
      expect(isValidCapabilityFormat(null as any)).toBe(false);
    });
  });
});
