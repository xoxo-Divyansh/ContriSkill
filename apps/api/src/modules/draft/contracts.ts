import type {
  SharedDraftPatchResultEnvelope,
  SharedDraftSnapshotEnvelope
} from "@contriskill/contracts";

export type DraftSyncPatchResponse = {
  data: {
    result: SharedDraftPatchResultEnvelope;
  };
};

export type DraftSyncSnapshotResponse = {
  data: {
    snapshot: SharedDraftSnapshotEnvelope;
  };
};

export type DraftSyncErrorResponse = {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND";
    message: string;
  };
};
