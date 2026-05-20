export const collaborativeMutationVersion = 1 as const;

export const collaborativeMutationTargetTypes = [
  "contribution.post",
  "contribution.application"
] as const;

export type CollaborativeMutationTargetType = (typeof collaborativeMutationTargetTypes)[number];

export const collaborativeMutationTypes = [
  "contribution.post.create.v1",
  "contribution.post.update.v1",
  "contribution.post.archive.v1",
  "contribution.application.submit.v1",
  "contribution.application.withdraw.v1"
] as const;

export type CollaborativeMutationType = (typeof collaborativeMutationTypes)[number];

export type CollaborativeMutationEnvelope<TPayload = Record<string, unknown>> = {
  version: typeof collaborativeMutationVersion;
  mutationId: string;
  clientId: string;
  actorId: string;
  targetType: CollaborativeMutationTargetType;
  targetId: string;
  mutationType: CollaborativeMutationType;
  payload: TPayload;
  timestamp: string;
  baseVersion?: number;
};

export type CollaborativeMutationStatus = "acknowledged" | "rejected" | "conflict";

export type CollaborativeMutationAcknowledgement = {
  version: typeof collaborativeMutationVersion;
  status: "acknowledged";
  mutationId: string;
  targetType: CollaborativeMutationTargetType;
  targetId: string;
  sequence: number;
  appliedVersion: number;
  acknowledgedAt: string;
};

export type CollaborativeMutationRejectionCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "MALFORMED_MUTATION"
  | "DUPLICATE_MUTATION"
  | "REPLAY_REJECTED";

export type CollaborativeMutationRejection = {
  version: typeof collaborativeMutationVersion;
  status: "rejected";
  mutationId: string;
  code: CollaborativeMutationRejectionCode;
  message: string;
  rejectedAt: string;
};

export type CollaborativeMutationConflictCode =
  | "STALE_BASE"
  | "SAME_FIELD_CONFLICT"
  | "INVALID_STATE"
  | "OWNERSHIP_FORBIDDEN";

export type CollaborativeMutationConflict = {
  version: typeof collaborativeMutationVersion;
  status: "conflict";
  mutationId: string;
  code: CollaborativeMutationConflictCode;
  message: string;
  conflictAt: string;
  serverVersion?: number;
};

export type CollaborativeMutationResultEnvelope =
  | CollaborativeMutationAcknowledgement
  | CollaborativeMutationRejection
  | CollaborativeMutationConflict;

export const isCollaborativeMutationType = (value: string): value is CollaborativeMutationType => {
  return collaborativeMutationTypes.includes(value as CollaborativeMutationType);
};

export const isCollaborativeMutationTargetType = (
  value: string
): value is CollaborativeMutationTargetType => {
  return collaborativeMutationTargetTypes.includes(value as CollaborativeMutationTargetType);
};
