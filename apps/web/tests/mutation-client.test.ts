import { describe, expect, it, vi } from "vitest";

import { createHttpClient } from "../src/lib/api/http-client";
import { createMutationClient } from "../src/lib/api/mutation-client";

describe("mutation client", () => {
  it("submits mutation envelope and returns typed acknowledgement result", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            result: {
              version: 1,
              status: "acknowledged",
              mutationId: "mut_1",
              targetType: "contribution.post",
              targetId: "post_1",
              sequence: 2,
              appliedVersion: 2,
              acknowledgedAt: new Date().toISOString()
            }
          }
        }),
        {
          status: 202,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    });

    const httpClient = createHttpClient({
      baseUrl: "http://localhost:4000",
      fetcher
    });
    const mutationClient = createMutationClient(httpClient);

    const result = await mutationClient.submitMutation({
      envelope: {
        version: 1,
        mutationId: "mut_1",
        clientId: "cli_1",
        actorId: "usr_1",
        targetType: "contribution.post",
        targetId: "post_1",
        mutationType: "contribution.post.update.v1",
        payload: { title: "updated" },
        timestamp: new Date().toISOString(),
        baseVersion: 1
      }
    });

    expect(result.status).toBe("acknowledged");
  });
});
