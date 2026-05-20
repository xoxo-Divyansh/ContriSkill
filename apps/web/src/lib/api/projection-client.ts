import type {
  SharedProjectionSnapshotEnvelope,
  SharedProjectionUpdateEnvelope,
  SharedProjectionUpdateResultEnvelope
} from "@contriskill/contracts";

import type { HttpClient } from "./types";

export type ProjectionClient = {
  getSnapshot(
    projectionId: string,
    accessToken?: string
  ): Promise<SharedProjectionSnapshotEnvelope>;
  syncUpdate(
    envelope: SharedProjectionUpdateEnvelope,
    accessToken?: string
  ): Promise<SharedProjectionUpdateResultEnvelope>;
};

const sessionHeader = (accessToken: string): HeadersInit => {
  return { "x-session-token": accessToken };
};

export const createProjectionClient = (httpClient: HttpClient): ProjectionClient => {
  return {
    getSnapshot: async (projectionId, accessToken) => {
      const response = await httpClient.get<{ snapshot: SharedProjectionSnapshotEnvelope }>(
        `/api/v1/projections/${projectionId}`,
        {
          ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
        }
      );
      return response.snapshot;
    },
    syncUpdate: async (envelope, accessToken) => {
      const response = await httpClient.post<
        { result: SharedProjectionUpdateResultEnvelope },
        SharedProjectionUpdateEnvelope
      >("/api/v1/projections/sync", {
        body: envelope,
        ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
      });
      return response.result;
    }
  };
};
