import { describe, expect, it, vi } from "vitest";

import { configureLogger, log } from "../src/observability/logger";

describe("observability logger", () => {
  it("redacts sensitive fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    configureLogger({ minimumLevel: "debug", serviceName: "api", environment: "test" });

    log("info", "test", {
      password: "123",
      token: "abc",
      nested: { authorization: "Bearer xyz" }
    });

    const payload = JSON.parse(spy.mock.calls[0]?.[0] as string) as {
      context: Record<string, unknown>;
    };

    expect(payload.context.password).toBe("[redacted]");
    expect(payload.context.token).toBe("[redacted]");
    expect(payload.context.nested).toEqual({ authorization: "[redacted]" });
    spy.mockRestore();
  });

  it("respects configured minimum log level", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    configureLogger({ minimumLevel: "warn", serviceName: "api", environment: "test" });

    log("info", "ignored");
    log("error", "kept");

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0]?.[0] as string) as { level: string };
    expect(payload.level).toBe("error");
    spy.mockRestore();
  });
});
