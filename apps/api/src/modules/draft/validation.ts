import {
  isSharedDraftTargetType,
  sharedDraftVersion,
  type SharedDraftPatchEnvelope
} from "@contriskill/contracts";

type ValidationSuccess = {
  ok: true;
  value: SharedDraftPatchEnvelope;
};

type ValidationFailure = {
  ok: false;
  message: string;
};

export type DraftPatchValidationResult = ValidationSuccess | ValidationFailure;

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

export const validateDraftPatchEnvelope = (raw: unknown): DraftPatchValidationResult => {
  if (!isObject(raw)) {
    return { ok: false, message: "Draft patch envelope must be an object." };
  }
  if (raw.version !== sharedDraftVersion) {
    return { ok: false, message: `Draft version must be ${sharedDraftVersion}.` };
  }

  const patchId = readString(raw.patchId);
  const draftId = readString(raw.draftId);
  const targetType = readString(raw.targetType);
  const targetId = readString(raw.targetId);
  const actorId = readString(raw.actorId);
  const clientId = readString(raw.clientId);
  const timestamp = readString(raw.timestamp);
  const draftVersion = readInteger(raw.draftVersion);
  const baseVersion = readInteger(raw.baseVersion);
  const patch = parsePatch(raw.patch);

  if (
    !patchId ||
    !draftId ||
    !targetType ||
    !targetId ||
    !actorId ||
    !clientId ||
    !timestamp ||
    draftVersion === undefined ||
    baseVersion === undefined ||
    !patch
  ) {
    return {
      ok: false,
      message:
        "patchId, draftId, targetType, targetId, actorId, clientId, draftVersion, baseVersion, timestamp, and patch are required."
    };
  }

  if (!isSharedDraftTargetType(targetType)) {
    return { ok: false, message: `Unsupported draft targetType "${targetType}".` };
  }

  if (Number.isNaN(Date.parse(timestamp))) {
    return { ok: false, message: "timestamp must be a valid ISO datetime string." };
  }

  return {
    ok: true,
    value: {
      version: sharedDraftVersion,
      patchId,
      draftId,
      targetType,
      targetId,
      actorId,
      clientId,
      draftVersion,
      baseVersion,
      patch,
      timestamp
    }
  };
};
