import { describe, expect, it, vi } from "vitest";

import { createDraftClient } from "../src/lib/api/draft-client";
import { createHttpClient } from "../src/lib/api/http-client";

describe("draft client", () => {
  it("syncs draft patches and returns typed result envelope", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            result: {
              version: 1,
              status: "acknowledged",
              patchId: "dpt_1",
              draftId: "draft:contribution:post_1",
              targetType: "contribution.post",
              targetId: "post_1",
              appliedDraftVersion: 2,
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
    const draftClient = createDraftClient(httpClient);
    const result = await draftClient.syncPatch({
      version: 1,
      patchId: "dpt_1",
      draftId: "draft:contribution:post_1",
      targetType: "contribution.post",
      targetId: "post_1",
      actorId: "usr_1",
      clientId: "web-client",
      draftVersion: 1,
      baseVersion: 1,
      patch: { note: "sync" },
      timestamp: new Date().toISOString()
    });

    expect(result.status).toBe("acknowledged");
  });
});
