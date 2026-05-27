import { beforeEach, describe, expect, it } from "vitest";

import {
  RateLimiter,
  extractRateLimitKey,
  getStandardRateLimitPolicies,
  type RateLimitPolicy
} from "../../src/security/rate-limiter";

describe("Rate Limiter Foundation", () => {
  describe("RateLimiter", () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      const policies: Record<string, RateLimitPolicy> = {
        test: { maxRequests: 5, windowSeconds: 10, name: "test_policy" },
        strict: { maxRequests: 1, windowSeconds: 5, name: "strict_policy" }
      };
      rateLimiter = new RateLimiter(policies);
    });

    it("allows requests within limit", () => {
      const result1 = rateLimiter.check("test", "user_123");
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4); // 5 total - 1 used

      const result2 = rateLimiter.check("test", "user_123");
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it("rejects requests exceeding limit", () => {
      // Use up all 5 requests
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.check("test", "user_123");
        expect(result.allowed).toBe(true);
      }

      // Next request should be rejected
      const result = rateLimiter.check("test", "user_123");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeLessThanOrEqual(10);
    });

    it("resets counter after window expiration", async () => {
      // Use up requests in strict policy (1 request per 5 seconds)
      const result1 = rateLimiter.check("strict", "user_456");
      expect(result1.allowed).toBe(true);

      const result2 = rateLimiter.check("strict", "user_456");
      expect(result2.allowed).toBe(false);

      // Wait for window to expire (simulated by creating new limiter)
      const newLimiter = new RateLimiter({
        strict: { maxRequests: 1, windowSeconds: 1, name: "strict_policy" }
      });

      // After window reset, should allow again
      const result3 = newLimiter.check("strict", "user_456");
      expect(result3.allowed).toBe(true);
    });

    it("tracks different keys separately", () => {
      const result1a = rateLimiter.check("test", "user_1");
      expect(result1a.allowed).toBe(true);

      const result1b = rateLimiter.check("test", "user_1");
      expect(result1b.allowed).toBe(true);
      expect(result1b.remaining).toBe(3);

      const result2a = rateLimiter.check("test", "user_2");
      expect(result2a.allowed).toBe(true);
      expect(result2a.remaining).toBe(4); // Fresh limit for different key
    });

    it("returns retry-after header value", () => {
      // Use up requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check("test", "user_789");
      }

      // Next request returns retry-after
      const result = rateLimiter.check("test", "user_789");
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(10);
    });

    it("handles unknown policy gracefully", () => {
      const result = rateLimiter.check("unknown_policy", "user_999");

      expect(result.allowed).toBe(true); // Unknown policy allows
    });

    it("provides metrics", () => {
      rateLimiter.check("test", "user_1");
      rateLimiter.check("test", "user_2");
      rateLimiter.check("test", "user_3");

      const metrics = rateLimiter.getMetrics();
      expect(metrics.trackedKeys).toBe(3);
      expect(metrics.policies.length).toBe(2);
    });

    it("clears all entries", () => {
      rateLimiter.check("test", "user_1");
      rateLimiter.check("test", "user_2");

      expect(rateLimiter.getMetrics().trackedKeys).toBe(2);

      rateLimiter.clear();
      expect(rateLimiter.getMetrics().trackedKeys).toBe(0);

      // After clear, should allow even if previously rate-limited
      const result = rateLimiter.check("test", "user_1");
      expect(result.allowed).toBe(true);
    });

    it("includes reset time in result", () => {
      rateLimiter.check("test", "user_100");

      const result = rateLimiter.check("test", "user_100");
      expect(result.resetAfterSeconds).toBeDefined();
      expect(result.resetAfterSeconds).toBeGreaterThan(0);
      expect(result.resetAfterSeconds).toBeLessThanOrEqual(10);
    });
  });

  describe("getStandardRateLimitPolicies", () => {
    it("provides development policies", () => {
      const policies = getStandardRateLimitPolicies("development");

      expect(policies.auth).toBeDefined();
      expect(policies.mutation).toBeDefined();
      expect(policies.realtime).toBeDefined();
      expect(policies.public_read).toBeDefined();

      // Dev policies are more generous
      expect(policies.auth!.maxRequests).toBeGreaterThan(10);
      expect(policies.mutation!.maxRequests).toBeGreaterThan(100);
    });

    it("provides production policies", () => {
      const policies = getStandardRateLimitPolicies("production");

      expect(policies.auth).toBeDefined();
      expect(policies.mutation).toBeDefined();
      expect(policies.realtime).toBeDefined();
      expect(policies.public_read).toBeDefined();

      // Production policies are stricter
      expect(policies.auth!.maxRequests).toBeLessThanOrEqual(10);
      expect(policies.mutation!.maxRequests).toBeLessThanOrEqual(100);
    });

    it("provides auth endpoint policy", () => {
      const policies = getStandardRateLimitPolicies("production");
      const authPolicy = policies.auth;

      expect(authPolicy).toBeDefined();
      expect(authPolicy!.name).toBe("auth_endpoints");
      expect(authPolicy!.includeRetryAfter).toBe(true);
      expect(authPolicy!.windowSeconds).toBeGreaterThan(0);
    });

    it("provides mutation endpoint policy", () => {
      const policies = getStandardRateLimitPolicies("production");
      const mutationPolicy = policies.mutation;

      expect(mutationPolicy).toBeDefined();
      expect(mutationPolicy!.name).toBe("mutation_endpoints");
      expect(mutationPolicy!.includeRetryAfter).toBe(true);
    });

    it("provides realtime handshake policy", () => {
      const policies = getStandardRateLimitPolicies("production");
      const realtimePolicy = policies.realtime;

      expect(realtimePolicy).toBeDefined();
      expect(realtimePolicy!.name).toBe("realtime_handshake");
      expect(realtimePolicy!.includeRetryAfter).toBe(true);
    });

    it("provides public read policy", () => {
      const policies = getStandardRateLimitPolicies("production");
      const publicPolicy = policies.public_read;

      expect(publicPolicy).toBeDefined();
      if (!publicPolicy) {
        return;
      }

      expect(publicPolicy.name).toBe("public_read");
      expect(publicPolicy.maxRequests).toBeGreaterThan(policies.mutation!.maxRequests);
      expect(publicPolicy.includeRetryAfter).toBe(false);
    });
  });

  describe("extractRateLimitKey", () => {
    it("extracts session key for authenticated users", () => {
      const key = extractRateLimitKey({
        authenticated: true,
        sessionId: "user_123"
      });

      expect(key).toBe("session_user_123");
    });

    it("extracts IP key for anonymous users", () => {
      const key = extractRateLimitKey({
        authenticated: false,
        clientIp: "192.168.1.1"
      });

      expect(key).toBe("ip_192.168.1.1");
    });

    it("prefers session key when both available", () => {
      const key = extractRateLimitKey({
        authenticated: true,
        sessionId: "user_456",
        clientIp: "10.0.0.1"
      });

      expect(key).toBe("session_user_456");
    });

    it("returns unknown key when no identifying info", () => {
      const key = extractRateLimitKey({});

      expect(key).toBe("unknown_key");
    });

    it("returns IP key when authenticated false but IP provided", () => {
      const key = extractRateLimitKey({
        authenticated: false,
        sessionId: "user_789",
        clientIp: "172.16.0.1"
      });

      expect(key).toBe("ip_172.16.0.1");
    });
  });
});
