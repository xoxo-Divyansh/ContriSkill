import {
  collaborativeMutationVersion,
  isCollaborativeMutationTargetType,
  isCollaborativeMutationType,
  type CollaborativeMutationEnvelope
} from "@contriskill/contracts";

type ValidationSuccess = {
  ok: true;
  value: CollaborativeMutationEnvelope;
};

type ValidationFailure = {
  ok: false;
  message: string;
};

export type MutationEnvelopeValidationResult = ValidationSuccess | ValidationFailure;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readOptionalInteger = (value: unknown): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return undefined;
  }
  return value;
};

export const validateMutationEnvelope = (raw: unknown): MutationEnvelopeValidationResult => {
  if (!isObject(raw)) {
    return { ok: false, message: "Mutation envelope must be an object." };
  }

  if (raw.version !== collaborativeMutationVersion) {
    return {
      ok: false,
      message: `Mutation version must be ${collaborativeMutationVersion}.`
    };
  }

  const mutationId = readString(raw.mutationId);
  const clientId = readString(raw.clientId);
  const actorId = readString(raw.actorId);
  const targetType = readString(raw.targetType);
  const targetId = readString(raw.targetId);
  const mutationType = readString(raw.mutationType);
  const timestamp = readString(raw.timestamp);
  const baseVersion = readOptionalInteger(raw.baseVersion);
  const payload = raw.payload;

  if (
    !mutationId ||
    !clientId ||
    !actorId ||
    !targetType ||
    !targetId ||
    !mutationType ||
    !timestamp
  ) {
    return {
      ok: false,
      message:
        "mutationId, clientId, actorId, targetType, targetId, mutationType, and timestamp are required."
    };
  }

  if (!isCollaborativeMutationTargetType(targetType)) {
    return {
      ok: false,
      message: `Unsupported targetType "${targetType}".`
    };
  }

  if (!isCollaborativeMutationType(mutationType)) {
    return {
      ok: false,
      message: `Unsupported mutationType "${mutationType}".`
    };
  }

  if (!isObject(payload)) {
    return {
      ok: false,
      message: "payload must be an object."
    };
  }

  if (Number.isNaN(Date.parse(timestamp))) {
    return {
      ok: false,
      message: "timestamp must be a valid ISO datetime string."
    };
  }

  if (raw.baseVersion !== undefined && baseVersion === undefined) {
    return {
      ok: false,
      message: "baseVersion must be a non-negative integer when provided."
    };
  }

  return {
    ok: true,
    value: {
      version: collaborativeMutationVersion,
      mutationId,
      clientId,
      actorId,
      targetType,
      targetId,
      mutationType,
      payload,
      timestamp,
      ...(baseVersion !== undefined ? { baseVersion } : {})
    }
  };
};
