import { describe, expect, it } from "vitest";

import { createContributionClient } from "../src/lib/api/contribution-client";
import type { HttpClient } from "../src/lib/api/types";

describe("contribution client", () => {
  it("calls contribution endpoints with session token header", async () => {
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

    const client = createContributionClient(httpClient);

    await client.listPosts(
      {
        limit: 10,
        state: "open",
        sort: "created_at_desc"
      },
      "tok_1"
    );
    await client.getPostById("post_1", "tok_1");
    await client.createPost(
      {
        type: "mentorship",
        title: "Need help",
        description: "Help needed",
        difficulty: "low",
        creditOffer: 20
      },
      "tok_1"
    );
    await client.submitApplication({ postId: "post_1", message: "I can help" }, "tok_1");
    await client.acceptApplication({ postId: "post_1", applicationId: "app_1" }, "tok_1");

    expect(calls[0]?.path).toBe("/api/v1/posts?limit=10&state=open&sort=created_at_desc");
    expect(calls[1]?.path).toBe("/api/v1/posts/post_1");
    expect(calls[2]?.path).toBe("/api/v1/posts");
    expect(calls[3]?.path).toBe("/api/v1/posts/post_1/applications");
    expect(calls[4]?.path).toBe("/api/v1/posts/post_1/applications/app_1/accept");
    expect(
      calls.every(
        (call) => JSON.stringify(call.headers) === JSON.stringify({ "x-session-token": "tok_1" })
      )
    ).toBe(true);
  });
});
