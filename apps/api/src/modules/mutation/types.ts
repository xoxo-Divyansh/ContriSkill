import type {
  CollaborativeMutationEnvelope,
  CollaborativeMutationResultEnvelope
} from "@contriskill/contracts";

import type { RequestActor } from "../auth/types";

export type MutationSubmissionInput = {
  envelope: CollaborativeMutationEnvelope;
  actor: RequestActor | undefined;
};

export type MutationSubmissionResult = {
  httpStatus: number;
  result: CollaborativeMutationResultEnvelope;
};

export type MutationIntakeService = {
  submitMutation: (input: MutationSubmissionInput) => MutationSubmissionResult;
};
