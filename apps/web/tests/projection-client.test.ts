import { describe, expect, it, vi } from "vitest";

import { createHttpClient } from "../src/lib/api/http-client";
import { createProjectionClient } from "../src/lib/api/projection-client";

describe("projection client", () => {
  it("syncs projection updates and returns typed result envelope", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            result: {
              version: 1,
              status: "acknowledged",
              updateId: "upd_1",
              projectionId: "projection:contribution:post_1",
              workspaceId: "workspace:post_1",
              targetType: "contribution.workspace",
              targetId: "post_1",
              appliedProjectionVersion: 2,
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
    const projectionClient = createProjectionClient(httpClient);
    const result = await projectionClient.syncUpdate({
      version: 1,
      updateId: "upd_1",
      projectionId: "projection:contribution:post_1",
      workspaceId: "workspace:post_1",
      targetType: "contribution.workspace",
      targetId: "post_1",
      actorId: "usr_1",
      clientId: "web-client",
      projectionVersion: 1,
      baseDraftVersion: 1,
      patch: { note: "sync projection" },
      timestamp: new Date().toISOString()
    });

    expect(result.status).toBe("acknowledged");
  });
});
