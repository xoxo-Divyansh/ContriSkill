import {
  isSharedProjectionTargetType,
  sharedProjectionVersion,
  type SharedProjectionUpdateEnvelope
} from "@contriskill/contracts";

type ValidationSuccess = {
  ok: true;
  value: SharedProjectionUpdateEnvelope;
};

type ValidationFailure = {
  ok: false;
  message: string;
};

export type ProjectionUpdateValidationResult = ValidationSuccess | ValidationFailure;

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

const readInteger = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return undefined;
  }
  return value;
};

const parsePatch = (value: unknown): Record<string, string | null> | undefined => {
  if (!isObject(value)) {
    return undefined;
  }
  const entries = Object.entries(value);
  const patch: Record<string, string | null> = {};
  for (const [key, raw] of entries) {
    if (raw === null) {
      patch[key] = null;
      continue;
    }
    if (typeof raw !== "string") {
      return undefined;
    }
    patch[key] = raw;
  }
  return patch;
};

export const validateProjectionUpdateEnvelope = (
  raw: unknown
): ProjectionUpdateValidationResult => {
  if (!isObject(raw)) {
    return { ok: false, message: "Projection update envelope must be an object." };
  }
  if (raw.version !== sharedProjectionVersion) {
    return { ok: false, message: `Projection version must be ${sharedProjectionVersion}.` };
  }

  const updateId = readString(raw.updateId);
  const projectionId = readString(raw.projectionId);
  const workspaceId = readString(raw.workspaceId);
  const targetType = readString(raw.targetType);
  const targetId = readString(raw.targetId);
  const actorId = readString(raw.actorId);
  const clientId = readString(raw.clientId);
  const timestamp = readString(raw.timestamp);
  const projectionVersion = readInteger(raw.projectionVersion);
  const baseDraftVersion = readInteger(raw.baseDraftVersion);
  const patch = parsePatch(raw.patch);

  if (
    !updateId ||
    !projectionId ||
    !workspaceId ||
    !targetType ||
    !targetId ||
    !actorId ||
    !clientId ||
    !timestamp ||
    projectionVersion === undefined ||
    baseDraftVersion === undefined ||
    !patch
  ) {
    return {
      ok: false,
      message:
        "updateId, projectionId, workspaceId, targetType, targetId, actorId, clientId, projectionVersion, baseDraftVersion, timestamp, and patch are required."
    };
  }

  if (!isSharedProjectionTargetType(targetType)) {
    return { ok: false, message: `Unsupported projection targetType "${targetType}".` };
  }

  if (Number.isNaN(Date.parse(timestamp))) {
    return { ok: false, message: "timestamp must be a valid ISO datetime string." };
  }

  return {
    ok: true,
    value: {
      version: sharedProjectionVersion,
      updateId,
      projectionId,
      workspaceId,
      targetType,
      targetId,
      actorId,
      clientId,
      projectionVersion,
      baseDraftVersion,
      patch,
      timestamp
    }
  };
};
