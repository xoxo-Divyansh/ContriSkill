export const sharedProjectionVersion = 1 as const;

export const sharedProjectionTargetTypes = ["contribution.workspace"] as const;

export type SharedProjectionTargetType = (typeof sharedProjectionTargetTypes)[number];

export type SharedProjectionFields = Record<string, string>;
export type SharedProjectionPatch = Record<string, string | null>;

export type SharedProjectionSnapshotEnvelope = {
  version: typeof sharedProjectionVersion;
  projectionId: string;
  workspaceId: string;
  targetType: SharedProjectionTargetType;
  targetId: string;
  actorId: string;
  clientId: string;
  projectionVersion: number;
  baseDraftVersion?: number;
  fields: SharedProjectionFields;
  timestamp: string;
};

export type SharedProjectionUpdateEnvelope = {
  version: typeof sharedProjectionVersion;
  updateId: string;
  projectionId: string;
  workspaceId: string;
  targetType: SharedProjectionTargetType;
  targetId: string;
  actorId: string;
  clientId: string;
  projectionVersion: number;
  baseDraftVersion: number;
  patch: SharedProjectionPatch;
  timestamp: string;
};

export type SharedProjectionAcknowledgementEnvelope = {
  version: typeof sharedProjectionVersion;
  status: "acknowledged";
  updateId: string;
  projectionId: string;
  workspaceId: string;
  targetType: SharedProjectionTargetType;
  targetId: string;
  appliedProjectionVersion: number;
  acknowledgedAt: string;
};

export type SharedProjectionRejectionCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "MALFORMED_PROJECTION_UPDATE"
  | "DUPLICATE_UPDATE"
  | "REPLAY_REJECTED";

export type SharedProjectionRejectionEnvelope = {
  version: typeof sharedProjectionVersion;
  status: "rejected";
  updateId: string;
  projectionId: string;
  code: SharedProjectionRejectionCode;
  message: string;
  rejectedAt: string;
};

export type SharedProjectionConflictCode = "STALE_BASE" | "INVALID_TARGET";

export type SharedProjectionConflictEnvelope = {
  version: typeof sharedProjectionVersion;
  status: "conflict";
  updateId: string;
  projectionId: string;
  workspaceId: string;
  targetType: SharedProjectionTargetType;
  targetId: string;
  code: SharedProjectionConflictCode;
  message: string;
  conflictAt: string;
  conflictDetails?: {
    baseDraftVersion?: number;
    serverProjectionVersion?: number;
  };
  serverProjectionVersion?: number;
};

export type SharedProjectionUpdateResultEnvelope =
  | SharedProjectionAcknowledgementEnvelope
  | SharedProjectionRejectionEnvelope
  | SharedProjectionConflictEnvelope;

export const isSharedProjectionTargetType = (
  value: string
): value is SharedProjectionTargetType => {
  return sharedProjectionTargetTypes.includes(value as SharedProjectionTargetType);
};
