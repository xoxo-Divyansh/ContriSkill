import {
  collaborativeMutationVersion,
  type CollaborativeMutationAcknowledgement,
  type CollaborativeMutationConflict,
  type CollaborativeMutationEnvelope,
  type CollaborativeMutationRejection,
  type CollaborativeMutationResultEnvelope
} from "@contriskill/contracts";

import { assertAuthenticatedActor, assertActorCapability } from "../auth/authorization";
import type { AuthCapability } from "../auth/capabilities";

import type {
  MutationIntakeService,
  MutationSubmissionInput,
  MutationSubmissionResult
} from "./types";

const mutationCapabilityByType: Record<
  CollaborativeMutationEnvelope["mutationType"],
  AuthCapability
> = {
  "contribution.post.create.v1": "contribution:create",
  "contribution.post.update.v1": "contribution:update",
  "contribution.post.archive.v1": "contribution:cancel",
  "contribution.application.submit.v1": "contribution:application:submit",
  "contribution.application.withdraw.v1": "contribution:application:submit"
};

type StoredResult = {
  actorId: string;
  result: CollaborativeMutationResultEnvelope;
};

const nowIso = (): string => new Date().toISOString();

const toRejected = (
  mutationId: string,
  code: CollaborativeMutationRejection["code"],
  message: string
): CollaborativeMutationRejection => {
  return {
    version: collaborativeMutationVersion,
    status: "rejected",
    mutationId,
    code,
    message,
    rejectedAt: nowIso()
  };
};

const toConflict = (
  envelope: CollaborativeMutationEnvelope,
  code: CollaborativeMutationConflict["code"],
  message: string,
  serverVersion?: number
): CollaborativeMutationConflict => {
  return {
    version: collaborativeMutationVersion,
    status: "conflict",
    mutationId: envelope.mutationId,
    targetType: envelope.targetType,
    targetId: envelope.targetId,
    code,
    message,
    conflictAt: nowIso(),
    conflictDetails: {
      ...(envelope.baseVersion !== undefined ? { baseVersion: envelope.baseVersion } : {}),
      ...(serverVersion !== undefined ? { serverVersion } : {})
    },
    ...(serverVersion !== undefined ? { serverVersion } : {})
  };
};

export const createMutationIntakeService = (): MutationIntakeService => {
  const seenMutationResults = new Map<string, StoredResult>();
  const targetVersionByKey = new Map<string, number>();
  const targetSequenceByKey = new Map<string, number>();

  return {
    submitMutation: (input: MutationSubmissionInput): MutationSubmissionResult => {
      const { envelope, actor } = input;

      try {
        assertAuthenticatedActor(actor);
      } catch {
        return {
          httpStatus: 401,
          result: toRejected(
            envelope.mutationId,
            "UNAUTHENTICATED",
            "Authentication is required for mutation submission."
          )
        };
      }

      if (actor.userId !== envelope.actorId) {
        return {
          httpStatus: 403,
          result: toRejected(
            envelope.mutationId,
            "FORBIDDEN",
            "Mutation actorId must match authenticated actor."
          )
        };
      }

      const seen = seenMutationResults.get(envelope.mutationId);
      if (seen) {
        if (seen.actorId !== actor.userId) {
          return {
            httpStatus: 409,
            result: toRejected(
              envelope.mutationId,
              "REPLAY_REJECTED",
              "Mutation id was already used by another actor."
            )
          };
        }
        return {
          httpStatus: seen.result.status === "acknowledged" ? 200 : 409,
          result: seen.result
        };
      }

      try {
        assertActorCapability(actor, mutationCapabilityByType[envelope.mutationType]);
      } catch {
        const rejection = toRejected(
          envelope.mutationId,
          "FORBIDDEN",
          `Missing required capability for mutation type "${envelope.mutationType}".`
        );
        seenMutationResults.set(envelope.mutationId, { actorId: actor.userId, result: rejection });
        return {
          httpStatus: 403,
          result: rejection
        };
      }

      const targetKey = `${envelope.targetType}:${envelope.targetId}`;
      const currentVersion = targetVersionByKey.get(targetKey) ?? 0;

      if (envelope.baseVersion !== undefined && envelope.baseVersion < currentVersion) {
        const conflict = toConflict(
          envelope,
          "STALE_BASE",
          "Mutation baseVersion is stale for target.",
          currentVersion
        );
        seenMutationResults.set(envelope.mutationId, { actorId: actor.userId, result: conflict });
        return {
          httpStatus: 409,
          result: conflict
        };
      }

      const nextSequence = (targetSequenceByKey.get(targetKey) ?? 0) + 1;
      const nextVersion = currentVersion + 1;
      targetSequenceByKey.set(targetKey, nextSequence);
      targetVersionByKey.set(targetKey, nextVersion);

      const acknowledgement: CollaborativeMutationAcknowledgement = {
        version: collaborativeMutationVersion,
        status: "acknowledged",
        mutationId: envelope.mutationId,
        targetType: envelope.targetType,
        targetId: envelope.targetId,
        sequence: nextSequence,
        appliedVersion: nextVersion,
        acknowledgedAt: nowIso()
      };

      seenMutationResults.set(envelope.mutationId, {
        actorId: actor.userId,
        result: acknowledgement
      });

      return {
        httpStatus: 202,
        result: acknowledgement
      };
    }
  };
};
