import { describe, expect, it } from "vitest";

import type { AuthSessionRecord } from "../../src/modules/auth/types";
import {
    isValidTokenFormat,
    validateSessionRecord
} from "../../src/security/session-validation";

describe("Session Validation Hardening", () => {
  describe("validateSessionRecord", () => {
    it("returns anonymous actor for undefined session", () => {
      const result = validateSessionRecord(undefined);

      expect(result.valid).toBe(false);
      expect(result.actor.actorType).toBe("anonymous");
      expect(result.diagnostics?.reason).toBe("session_not_found");
    });

    it("returns anonymous actor for null session", () => {
      const result = validateSessionRecord(null as any);

      expect(result.valid).toBe(false);
      expect(result.actor.actorType).toBe("anonymous");
    });

    it("detects missing required fields", () => {
      const session: Partial<AuthSessionRecord> = {
        id: "ses_123",
        userId: "user_123",
        // Missing role, state, issuedAt, expiresAt
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        lastSeenAt: "2026-05-26T10:00:00Z"
      };

      const result = validateSessionRecord(session as AuthSessionRecord);

      expect(result.valid).toBe(false);
      expect(result.diagnostics?.reason).toBe("malformed_session_record");
      expect(result.diagnostics?.riskLevel).toBe("high");
      expect(result.diagnostics?.suspicious).toBe(true);
    });

    it("rejects revoked sessions", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "authenticated",
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: now.toISOString(),
        expiresAt: future.toISOString(),
        lastSeenAt: now.toISOString(),
        revokedAt: now.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(false);
      expect(result.diagnostics?.reason).toBe("session_revoked");
      expect(result.actor.sessionState).toBe("expired");
    });

    it("rejects expired sessions", () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "authenticated",
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: past.toISOString(), // Already expired
        lastSeenAt: now.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(false);
      expect(result.diagnostics?.reason).toBe("session_expired");
    });

    it("rejects sessions with invalid state", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "expired" as any, // Invalid state
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: now.toISOString(),
        expiresAt: future.toISOString(),
        lastSeenAt: now.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(false);
      expect(result.diagnostics?.reason).toBe("invalid_session_state");
      expect(result.diagnostics?.suspicious).toBe(true);
    });

    it("rejects sessions with incoherent timestamps", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "authenticated",
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: future.toISOString(), // issuedAt > now
        expiresAt: future.toISOString(),
        lastSeenAt: now.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(false);
      expect(result.diagnostics?.reason).toBe("invalid_session_timestamps");
      expect(result.diagnostics?.riskLevel).toBe("high");
    });

    it("accepts valid session and returns authenticated actor", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "authenticated",
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: now.toISOString(),
        expiresAt: future.toISOString(),
        lastSeenAt: now.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(true);
      expect(result.actor.actorType).toBe("authenticated");
      expect(result.actor.userId).toBe("user_123");
      expect(result.actor.role).toBe("user");
      expect(result.actor.sessionState).toBe("authenticated");
    });

    it("tolerates lastSeenAt with clock skew", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const futureLastSeen = new Date(now.getTime() + 30 * 1000); // 30s in future (within tolerance)

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "authenticated",
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: now.toISOString(),
        expiresAt: future.toISOString(),
        lastSeenAt: futureLastSeen.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(true);
    });

    it("rejects lastSeenAt too far in future", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tooFuture = new Date(now.getTime() + 90 * 1000); // 90s in future (> 60s tolerance)

      const session: AuthSessionRecord = {
        id: "ses_123",
        userId: "user_123",
        role: "user",
        state: "authenticated",
        accessToken: "atk_token",
        refreshToken: "rtk_token",
        issuedAt: now.toISOString(),
        expiresAt: future.toISOString(),
        lastSeenAt: tooFuture.toISOString()
      };

      const result = validateSessionRecord(session);

      expect(result.valid).toBe(false);
      expect(result.diagnostics?.reason).toBe("suspicious_last_seen_timestamp");
      expect(result.diagnostics?.suspicious).toBe(true);
    });
  });

  describe("isValidTokenFormat", () => {
    it("accepts valid access token format", () => {
      const token = "atk_550e8400-e29b-41d4-a716-446655440000";
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("accepts valid refresh token format", () => {
      const token = "rtk_550e8400-e29b-41d4-a716-446655440000";
      expect(isValidTokenFormat(token)).toBe(true);
    });

    it("rejects missing prefix", () => {
      const token = "550e8400-e29b-41d4-a716-446655440000";
      expect(isValidTokenFormat(token)).toBe(false);
    });

    it("rejects invalid prefix", () => {
      const token = "xyz_550e8400-e29b-41d4-a716-446655440000";
      expect(isValidTokenFormat(token)).toBe(false);
    });

    it("rejects malformed UUID", () => {
      const token = "atk_invalid-uuid-format";
      expect(isValidTokenFormat(token)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidTokenFormat(undefined)).toBe(false);
    });

    it("rejects null", () => {
      expect(isValidTokenFormat(null as any)).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isValidTokenFormat(123 as any)).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidTokenFormat("")).toBe(false);
    });

    it("rejects whitespace-only string", () => {
      expect(isValidTokenFormat("   ")).toBe(false);
    });

    it("rejects JWT format", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      expect(isValidTokenFormat(jwt)).toBe(false);
    });

    it("rejects token with extra spaces", () => {
      const token = " atk_550e8400-e29b-41d4-a716-446655440000 ";
      expect(isValidTokenFormat(token)).toBe(false);
    });

    it("rejects token too long", () => {
      const token = "atk_550e8400-e29b-41d4-a716-446655440000-extra";
      expect(isValidTokenFormat(token)).toBe(false);
    });
  });
});
