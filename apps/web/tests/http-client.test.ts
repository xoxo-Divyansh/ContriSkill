import { describe, expect, it, vi } from "vitest";

import { createHttpClient } from "../src/lib/api/http-client";
import { ApiClientError } from "../src/lib/api/types";

describe("http client", () => {
  it("returns data from API success envelope", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            id: "usr_1",
            username: "contributor01"
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:4000",
      fetcher
    });

    const payload = await client.get<{ id: string; username: string }>("/api/v1/users/usr_1");

    expect(payload.id).toBe("usr_1");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("normalizes API envelope errors for non-2xx responses", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Role does not allow this action."
          }
        }),
        {
          status: 403,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:4000",
      fetcher
    });

    await expect(client.get("/api/v1/users/me/reputation")).rejects.toMatchObject({
      kind: "api",
      code: "FORBIDDEN",
      status: 403
    });
  });

  it("throws invalid_response when success payload is malformed", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          profile: {
            id: "usr_1"
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:4000",
      fetcher
    });

    await expect(client.get("/api/v1/users/usr_1")).rejects.toMatchObject({
      kind: "invalid_response",
      code: "INVALID_RESPONSE"
    });
  });

  it("normalizes low-level fetch failures as transport errors", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("socket hang up");
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:4000",
      fetcher
    });

    await expect(client.get("/api/v1/health")).rejects.toBeInstanceOf(ApiClientError);
    await expect(client.get("/api/v1/health")).rejects.toMatchObject({
      kind: "transport",
      code: "TRANSPORT_ERROR",
      transportErrorKind: "network"
    });
  });
});
