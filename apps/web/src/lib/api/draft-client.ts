import type {
  SharedDraftPatchEnvelope,
  SharedDraftPatchResultEnvelope,
  SharedDraftSnapshotEnvelope
} from "@contriskill/contracts";

import type { HttpClient } from "./types";

export type DraftClient = {
  getSnapshot(draftId: string, accessToken?: string): Promise<SharedDraftSnapshotEnvelope>;
  syncPatch(
    envelope: SharedDraftPatchEnvelope,
    accessToken?: string
  ): Promise<SharedDraftPatchResultEnvelope>;
};

const sessionHeader = (accessToken: string): HeadersInit => {
  return { "x-session-token": accessToken };
};

export const createDraftClient = (httpClient: HttpClient): DraftClient => {
  return {
    getSnapshot: async (draftId, accessToken) => {
      const response = await httpClient.get<{ snapshot: SharedDraftSnapshotEnvelope }>(
        `/api/v1/drafts/${draftId}`,
        {
          ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
        }
      );
      return response.snapshot;
    },
    syncPatch: async (envelope, accessToken) => {
      const response = await httpClient.post<
        { result: SharedDraftPatchResultEnvelope },
        SharedDraftPatchEnvelope
      >("/api/v1/drafts/sync", {
        body: envelope,
        ...(accessToken ? { headers: sessionHeader(accessToken) } : {})
      });
      return response.result;
    }
  };
};
