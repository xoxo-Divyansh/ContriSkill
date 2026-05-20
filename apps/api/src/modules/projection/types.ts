import type {
  SharedProjectionSnapshotEnvelope,
  SharedProjectionUpdateEnvelope,
  SharedProjectionUpdateResultEnvelope
} from "@contriskill/contracts";

import type { RequestActor } from "../auth/types";

export type ProjectionUpdateSubmissionInput = {
  envelope: SharedProjectionUpdateEnvelope;
  actor: RequestActor | undefined;
};

export type ProjectionUpdateSubmissionResult = {
  httpStatus: number;
  result: SharedProjectionUpdateResultEnvelope;
};

export type ProjectionSyncService = {
  submitUpdate: (input: ProjectionUpdateSubmissionInput) => ProjectionUpdateSubmissionResult;
  getSnapshotById: (projectionId: string) => SharedProjectionSnapshotEnvelope | undefined;
};
