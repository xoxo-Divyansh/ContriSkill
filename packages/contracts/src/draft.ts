export const sharedDraftVersion = 1 as const;

export const sharedDraftTargetTypes = ["contribution.post"] as const;

export type SharedDraftTargetType = (typeof sharedDraftTargetTypes)[number];

export type SharedDraftFields = Record<string, string>;
export type SharedDraftPatch = Record<string, string | null>;

export type SharedDraftSnapshotEnvelope = {
  version: typeof sharedDraftVersion;
  draftId: string;
  targetType: SharedDraftTargetType;
  targetId: string;
  actorId: string;
  clientId: string;
  draftVersion: number;
  baseVersion?: number;
  fields: SharedDraftFields;
  timestamp: string;
};

export type SharedDraftPatchEnvelope = {
  version: typeof sharedDraftVersion;
  patchId: string;
  draftId: string;
  targetType: SharedDraftTargetType;
  targetId: string;
  actorId: string;
  clientId: string;
  draftVersion: number;
  baseVersion: number;
  patch: SharedDraftPatch;
  timestamp: string;
};

export type SharedDraftAcknowledgementEnvelope = {
  version: typeof sharedDraftVersion;
  status: "acknowledged";
  patchId: string;
  draftId: string;
  targetType: SharedDraftTargetType;
  targetId: string;
  appliedDraftVersion: number;
  acknowledgedAt: string;
};

export type SharedDraftRejectionCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "MALFORMED_DRAFT_PATCH"
  | "DUPLICATE_PATCH"
  | "REPLAY_REJECTED";

export type SharedDraftRejectionEnvelope = {
  version: typeof sharedDraftVersion;
  status: "rejected";
  patchId: string;
  draftId: string;
  code: SharedDraftRejectionCode;
  message: string;
  rejectedAt: string;
};

export type SharedDraftConflictCode = "STALE_BASE" | "INVALID_TARGET";

export type SharedDraftConflictEnvelope = {
  version: typeof sharedDraftVersion;
  status: "conflict";
  patchId: string;
  draftId: string;
  targetType: SharedDraftTargetType;
  targetId: string;
  code: SharedDraftConflictCode;
  message: string;
  conflictAt: string;
  conflictDetails?: {
    baseVersion?: number;
    serverVersion?: number;
  };
  serverDraftVersion?: number;
};

export type SharedDraftPatchResultEnvelope =
  | SharedDraftAcknowledgementEnvelope
  | SharedDraftRejectionEnvelope
  | SharedDraftConflictEnvelope;

export const isSharedDraftTargetType = (value: string): value is SharedDraftTargetType => {
  return sharedDraftTargetTypes.includes(value as SharedDraftTargetType);
};
