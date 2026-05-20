import {
  sharedDraftVersion,
  type SharedDraftAcknowledgementEnvelope,
  type SharedDraftConflictEnvelope,
  type SharedDraftPatchEnvelope,
  type SharedDraftPatchResultEnvelope,
  type SharedDraftRejectionEnvelope,
  type SharedDraftSnapshotEnvelope
} from "@contriskill/contracts";

import { assertActorCapability, assertAuthenticatedActor } from "../auth/authorization";

import type {
  DraftPatchSubmissionInput,
  DraftPatchSubmissionResult,
  DraftSyncService
} from "./types";

type StoredPatchResult = {
  actorId: string;
  result: SharedDraftPatchResultEnvelope;
};

type StoredDraft = {
  snapshot: SharedDraftSnapshotEnvelope;
};

const nowIso = (): string => new Date().toISOString();

const toRejected = (
  envelope: SharedDraftPatchEnvelope,
  code: SharedDraftRejectionEnvelope["code"],
  message: string
): SharedDraftRejectionEnvelope => {
  return {
    version: sharedDraftVersion,
    status: "rejected",
    patchId: envelope.patchId,
    draftId: envelope.draftId,
    code,
    message,
    rejectedAt: nowIso()
  };
};

const toConflict = (
  envelope: SharedDraftPatchEnvelope,
  code: SharedDraftConflictEnvelope["code"],
  message: string,
  serverVersion?: number
): SharedDraftConflictEnvelope => {
  return {
    version: sharedDraftVersion,
    status: "conflict",
    patchId: envelope.patchId,
    draftId: envelope.draftId,
    targetType: envelope.targetType,
    targetId: envelope.targetId,
    code,
    message,
    conflictAt: nowIso(),
    conflictDetails: {
      baseVersion: envelope.baseVersion,
      ...(serverVersion !== undefined ? { serverVersion } : {})
    },
    ...(serverVersion !== undefined ? { serverDraftVersion: serverVersion } : {})
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

export const createDraftSyncService = (): DraftSyncService => {
  const draftsById = new Map<string, StoredDraft>();
  const seenPatchResults = new Map<string, StoredPatchResult>();

  return {
    submitPatch: (input: DraftPatchSubmissionInput): DraftPatchSubmissionResult => {
      const { envelope, actor } = input;

      try {
        assertAuthenticatedActor(actor);
      } catch {
        return {
          httpStatus: 401,
          result: toRejected(
            envelope,
            "UNAUTHENTICATED",
            "Authentication is required for draft synchronization."
          )
        };
      }

      if (actor.userId !== envelope.actorId) {
        return {
          httpStatus: 403,
          result: toRejected(envelope, "FORBIDDEN", "Draft actorId must match authenticated actor.")
        };
      }

      const existingPatch = seenPatchResults.get(envelope.patchId);
      if (existingPatch) {
        if (existingPatch.actorId !== actor.userId) {
          return {
            httpStatus: 409,
            result: toRejected(
              envelope,
              "REPLAY_REJECTED",
              "Patch id was already used by another actor."
            )
          };
        }
        return {
          httpStatus: existingPatch.result.status === "acknowledged" ? 200 : 409,
          result: existingPatch.result
        };
      }

      try {
        assertActorCapability(actor, "draft:sync");
      } catch {
        const rejection = toRejected(
          envelope,
          "FORBIDDEN",
          'Capability "draft:sync" is required for draft synchronization.'
        );
        seenPatchResults.set(envelope.patchId, { actorId: actor.userId, result: rejection });
        return { httpStatus: 403, result: rejection };
      }

      const existingDraft = draftsById.get(envelope.draftId);
      const currentDraftVersion = existingDraft?.snapshot.draftVersion ?? 0;

      if (existingDraft) {
        if (
          existingDraft.snapshot.targetType !== envelope.targetType ||
          existingDraft.snapshot.targetId !== envelope.targetId
        ) {
          const conflict = toConflict(
            envelope,
            "INVALID_TARGET",
            "Draft target does not match existing draft target.",
            existingDraft.snapshot.draftVersion
          );
          seenPatchResults.set(envelope.patchId, { actorId: actor.userId, result: conflict });
          return { httpStatus: 409, result: conflict };
        }
      }

      if (envelope.baseVersion < currentDraftVersion) {
        const conflict = toConflict(
          envelope,
          "STALE_BASE",
          "Draft patch baseVersion is stale.",
          currentDraftVersion
        );
        seenPatchResults.set(envelope.patchId, { actorId: actor.userId, result: conflict });
        return {
          httpStatus: 409,
          result: conflict
        };
      }

      const nextDraftVersion = currentDraftVersion + 1;
      const previousFields = existingDraft?.snapshot.fields ?? {};
      const nextFields = applyPatch(previousFields, envelope.patch);

      const snapshot: SharedDraftSnapshotEnvelope = {
        version: sharedDraftVersion,
        draftId: envelope.draftId,
        targetType: envelope.targetType,
        targetId: envelope.targetId,
        actorId: envelope.actorId,
        clientId: envelope.clientId,
        draftVersion: nextDraftVersion,
        baseVersion: envelope.baseVersion,
        fields: nextFields,
        timestamp: nowIso()
      };
      draftsById.set(envelope.draftId, { snapshot });

      const acknowledgement: SharedDraftAcknowledgementEnvelope = {
        version: sharedDraftVersion,
        status: "acknowledged",
        patchId: envelope.patchId,
        draftId: envelope.draftId,
        targetType: envelope.targetType,
        targetId: envelope.targetId,
        appliedDraftVersion: nextDraftVersion,
        acknowledgedAt: nowIso()
      };
      seenPatchResults.set(envelope.patchId, {
        actorId: actor.userId,
        result: acknowledgement
      });

      return {
        httpStatus: 202,
        result: acknowledgement
      };
    },
    getSnapshotById: (draftId) => {
      return draftsById.get(draftId)?.snapshot;
    }
  };
};
