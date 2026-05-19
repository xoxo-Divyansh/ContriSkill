import { describe, expect, it } from "vitest";

import { createAuthClient } from "../src/lib/api/auth-client";
import type { HttpClient } from "../src/lib/api/types";

describe("auth client", () => {
  it("passes session header for authenticated endpoints", async () => {
    const calls: Array<{ path: string; headers?: HeadersInit; body?: unknown }> = [];
    const httpClient: HttpClient = {
      request: async <TData>() => Promise.resolve({} as TData),
      get: async <TData>(path, options) => {
        calls.push({ path, headers: options?.headers });
        return Promise.resolve({} as TData);
      },
      post: async <TData>(path, options) => {
        calls.push({ path, headers: options?.headers, body: options?.body });
        return Promise.resolve({} as TData);
      },
      patch: async <TData>() => Promise.resolve({} as TData),
      del: async <TData>() => Promise.resolve({} as TData)
    };

    const client = createAuthClient(httpClient);
    await client.getSession({ accessToken: "tok_123" });
    await client.logout({ accessToken: "tok_123" });
    await client.refresh({ accessToken: "tok_123", refreshToken: "ref_1" });

    expect(calls).toHaveLength(3);
    expect(calls[0]?.headers).toEqual({ "x-session-token": "tok_123" });
    expect(calls[1]?.headers).toEqual({ "x-session-token": "tok_123" });
    expect(calls[2]?.headers).toEqual({ "x-session-token": "tok_123" });
    expect(calls[2]?.body).toEqual({ refreshToken: "ref_1" });
  });
});
