import {
  sharedProjectionVersion,
  type SharedProjectionAcknowledgementEnvelope,
  type SharedProjectionConflictEnvelope,
  type SharedProjectionRejectionEnvelope,
  type SharedProjectionSnapshotEnvelope,
  type SharedProjectionUpdateEnvelope,
  type SharedProjectionUpdateResultEnvelope
} from "@contriskill/contracts";

import { assertActorCapability, assertAuthenticatedActor } from "../auth/authorization";

import type {
  ProjectionSyncService,
  ProjectionUpdateSubmissionInput,
  ProjectionUpdateSubmissionResult
} from "./types";

type StoredResult = {
  actorId: string;
  result: SharedProjectionUpdateResultEnvelope;
};

type StoredProjection = {
  snapshot: SharedProjectionSnapshotEnvelope;
};

const nowIso = (): string => new Date().toISOString();

const toRejected = (
  envelope: SharedProjectionUpdateEnvelope,
  code: SharedProjectionRejectionEnvelope["code"],
  message: string
): SharedProjectionRejectionEnvelope => {
  return {
    version: sharedProjectionVersion,
    status: "rejected",
    updateId: envelope.updateId,
    projectionId: envelope.projectionId,
    code,
    message,
    rejectedAt: nowIso()
  };
};

const toConflict = (
  envelope: SharedProjectionUpdateEnvelope,
  code: SharedProjectionConflictEnvelope["code"],
  message: string,
  serverProjectionVersion?: number
): SharedProjectionConflictEnvelope => {
  return {
    version: sharedProjectionVersion,
    status: "conflict",
    updateId: envelope.updateId,
    projectionId: envelope.projectionId,
    workspaceId: envelope.workspaceId,
    targetType: envelope.targetType,
    targetId: envelope.targetId,
    code,
    message,
    conflictAt: nowIso(),
    conflictDetails: {
      baseDraftVersion: envelope.baseDraftVersion,
      ...(serverProjectionVersion !== undefined ? { serverProjectionVersion } : {})
    },
    ...(serverProjectionVersion !== undefined ? { serverProjectionVersion } : {})
  };
};

const applyPatch = (
  fields: Record<string, string>,
  patch: Record<string, string | null>
): Record<string, string> => {
  const next = { ...fields };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete next[key];
      continue;
    }
    next[key] = value;
  }
  return next;
};

export const createProjectionSyncService = (): ProjectionSyncService => {
  const projectionsById = new Map<string, StoredProjection>();
  const seenUpdateResults = new Map<string, StoredResult>();

  return {
    submitUpdate: (input: ProjectionUpdateSubmissionInput): ProjectionUpdateSubmissionResult => {
      const { envelope, actor } = input;

      try {
        assertAuthenticatedActor(actor);
      } catch {
        return {
          httpStatus: 401,
          result: toRejected(
            envelope,
            "UNAUTHENTICATED",
            "Authentication is required for projection synchronization."
          )
        };
      }

      if (actor.userId !== envelope.actorId) {
        return {
          httpStatus: 403,
          result: toRejected(
            envelope,
            "FORBIDDEN",
            "Projection actorId must match authenticated actor."
          )
        };
      }

      const existingUpdate = seenUpdateResults.get(envelope.updateId);
      if (existingUpdate) {
        if (existingUpdate.actorId !== actor.userId) {
          return {
            httpStatus: 409,
            result: toRejected(
              envelope,
              "REPLAY_REJECTED",
              "Update id was already used by another actor."
            )
          };
        }
        return {
          httpStatus: existingUpdate.result.status === "acknowledged" ? 200 : 409,
          result: existingUpdate.result
        };
      }

      try {
        assertActorCapability(actor, "projection:sync");
      } catch {
        const rejection = toRejected(
          envelope,
          "FORBIDDEN",
          'Capability "projection:sync" is required for projection synchronization.'
        );
        seenUpdateResults.set(envelope.updateId, { actorId: actor.userId, result: rejection });
        return { httpStatus: 403, result: rejection };
      }

      const existingProjection = projectionsById.get(envelope.projectionId);
      const currentProjectionVersion = existingProjection?.snapshot.projectionVersion ?? 0;

      if (existingProjection) {
        if (
          existingProjection.snapshot.workspaceId !== envelope.workspaceId ||
          existingProjection.snapshot.targetType !== envelope.targetType ||
          existingProjection.snapshot.targetId !== envelope.targetId
        ) {
          const conflict = toConflict(
            envelope,
            "INVALID_TARGET",
            "Projection target does not match existing projection target.",
            existingProjection.snapshot.projectionVersion
          );
          seenUpdateResults.set(envelope.updateId, { actorId: actor.userId, result: conflict });
          return { httpStatus: 409, result: conflict };
        }
      }

      if (envelope.baseDraftVersion < currentProjectionVersion) {
        const conflict = toConflict(
          envelope,
          "STALE_BASE",
          "Projection update baseDraftVersion is stale.",
          currentProjectionVersion
        );
        seenUpdateResults.set(envelope.updateId, { actorId: actor.userId, result: conflict });
        return { httpStatus: 409, result: conflict };
      }

      const nextProjectionVersion = currentProjectionVersion + 1;
      const previousFields = existingProjection?.snapshot.fields ?? {};
      const nextFields = applyPatch(previousFields, envelope.patch);
      const snapshot: SharedProjectionSnapshotEnvelope = {
        version: sharedProjectionVersion,
        projectionId: envelope.projectionId,
        workspaceId: envelope.workspaceId,
        targetType: envelope.targetType,
        targetId: envelope.targetId,
        actorId: envelope.actorId,
        clientId: envelope.clientId,
        projectionVersion: nextProjectionVersion,
        baseDraftVersion: envelope.baseDraftVersion,
        fields: nextFields,
        timestamp: nowIso()
      };
      projectionsById.set(envelope.projectionId, { snapshot });

      const acknowledgement: SharedProjectionAcknowledgementEnvelope = {
        version: sharedProjectionVersion,
        status: "acknowledged",
        updateId: envelope.updateId,
        projectionId: envelope.projectionId,
        workspaceId: envelope.workspaceId,
        targetType: envelope.targetType,
        targetId: envelope.targetId,
        appliedProjectionVersion: nextProjectionVersion,
        acknowledgedAt: nowIso()
      };
      seenUpdateResults.set(envelope.updateId, { actorId: actor.userId, result: acknowledgement });

      return { httpStatus: 202, result: acknowledgement };
    },
    getSnapshotById: (projectionId) => {
      return projectionsById.get(projectionId)?.snapshot;
    }
  };
};
