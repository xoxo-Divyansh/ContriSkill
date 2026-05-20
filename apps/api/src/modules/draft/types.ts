import type {
  SharedDraftPatchEnvelope,
  SharedDraftPatchResultEnvelope,
  SharedDraftSnapshotEnvelope
} from "@contriskill/contracts";

import type { RequestActor } from "../auth/types";

export type DraftPatchSubmissionInput = {
  envelope: SharedDraftPatchEnvelope;
  actor: RequestActor | undefined;
};

export type DraftPatchSubmissionResult = {
  httpStatus: number;
  result: SharedDraftPatchResultEnvelope;
};

export type DraftSyncService = {
  submitPatch: (input: DraftPatchSubmissionInput) => DraftPatchSubmissionResult;
  getSnapshotById: (draftId: string) => SharedDraftSnapshotEnvelope | undefined;
};
