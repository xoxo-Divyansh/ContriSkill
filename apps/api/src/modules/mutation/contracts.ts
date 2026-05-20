import type {
  CollaborativeMutationAcknowledgement,
  CollaborativeMutationConflict,
  CollaborativeMutationRejection
} from "@contriskill/contracts";

export type MutationIntakeResponse = {
  data: {
    result:
      | CollaborativeMutationAcknowledgement
      | CollaborativeMutationRejection
      | CollaborativeMutationConflict;
  };
};

export type MutationIntakeErrorResponse = {
  error: {
    code: "VALIDATION_ERROR";
    message: string;
  };
};
