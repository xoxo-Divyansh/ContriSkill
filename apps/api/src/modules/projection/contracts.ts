import type {
  SharedProjectionSnapshotEnvelope,
  SharedProjectionUpdateResultEnvelope
} from "@contriskill/contracts";

export type ProjectionSyncSnapshotResponse = {
  data: {
    snapshot: SharedProjectionSnapshotEnvelope;
  };
};

export type ProjectionSyncUpdateResponse = {
  data: {
    result: SharedProjectionUpdateResultEnvelope;
  };
};

export type ProjectionSyncErrorResponse = {
  error: {
    code: "VALIDATION_ERROR" | "NOT_FOUND";
    message: string;
  };
};
