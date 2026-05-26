import {
  contributionDifficulties,
  contributionPostStates,
  contributionTypes
} from "../../../../../packages/domain/src/contribution/index.js";

import type {
  CancelContributionRequestBody,
  CreateContributionRequestBody,
  SubmitApplicationRequestBody,
  TransitionContributionRequestBody,
  UpdateContributionRequestBody
} from "./contracts";

type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

type ValidationFailure = {
  ok: false;
  message: string;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const hasOnlyAllowedKeys = (value: Record<string, unknown>, allowed: readonly string[]): boolean => {
  return Object.keys(value).every((key) => allowed.includes(key));
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || typeof value === "string";
};

const isNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const validateCreateContributionBody = (
  body: unknown
): ValidationResult<CreateContributionRequestBody> => {
  if (!isPlainObject(body)) {
    return { ok: false, message: "request body is required." };
  }
  if (!hasOnlyAllowedKeys(body, ["type", "title", "description", "difficulty", "creditOffer"])) {
    return { ok: false, message: "request body contains unsupported fields." };
  }

  const candidate = body as Partial<CreateContributionRequestBody>;
  if (!candidate.type || !contributionTypes.includes(candidate.type)) {
    return { ok: false, message: "type must be a valid contribution type." };
  }
  if (!isNonEmptyString(candidate.title)) {
    return { ok: false, message: "title is required." };
  }
  if (!isNonEmptyString(candidate.description)) {
    return { ok: false, message: "description is required." };
  }
  if (!candidate.difficulty || !contributionDifficulties.includes(candidate.difficulty)) {
    return { ok: false, message: "difficulty must be a valid value." };
  }
  if (!isNumber(candidate.creditOffer)) {
    return { ok: false, message: "creditOffer must be a number." };
  }

  return {
    ok: true,
    value: {
      type: candidate.type,
      title: candidate.title.trim(),
      description: candidate.description.trim(),
      difficulty: candidate.difficulty,
      creditOffer: candidate.creditOffer
    }
  };
};

export const validateUpdateContributionBody = (
  body: unknown
): ValidationResult<UpdateContributionRequestBody> => {
  if (!isPlainObject(body)) {
    return { ok: false, message: "request body is required." };
  }
  if (!hasOnlyAllowedKeys(body, ["title", "description", "difficulty", "creditOffer"])) {
    return { ok: false, message: "request body contains unsupported fields." };
  }

  const candidate = body as UpdateContributionRequestBody;
  if (
    candidate.title === undefined &&
    candidate.description === undefined &&
    candidate.difficulty === undefined &&
    candidate.creditOffer === undefined
  ) {
    return { ok: false, message: "at least one editable field is required." };
  }

  if (candidate.title !== undefined && !isNonEmptyString(candidate.title)) {
    return { ok: false, message: "title must be a non-empty string." };
  }

  if (candidate.description !== undefined && !isNonEmptyString(candidate.description)) {
    return { ok: false, message: "description must be a non-empty string." };
  }

  if (
    candidate.difficulty !== undefined &&
    !contributionDifficulties.includes(candidate.difficulty)
  ) {
    return { ok: false, message: "difficulty must be a valid value." };
  }

  if (candidate.creditOffer !== undefined && !isNumber(candidate.creditOffer)) {
    return { ok: false, message: "creditOffer must be a number." };
  }

  return {
    ok: true,
    value: {
      ...(candidate.title ? { title: candidate.title.trim() } : {}),
      ...(candidate.description ? { description: candidate.description.trim() } : {}),
      ...(candidate.difficulty ? { difficulty: candidate.difficulty } : {}),
      ...(candidate.creditOffer !== undefined ? { creditOffer: candidate.creditOffer } : {})
    }
  };
};

export const validateCancelContributionBody = (
  body: unknown
): ValidationResult<CancelContributionRequestBody> => {
  if (body === undefined || body === null) {
    return { ok: true, value: {} };
  }

  if (!isPlainObject(body)) {
    return { ok: false, message: "request body must be an object." };
  }
  if (!hasOnlyAllowedKeys(body, ["reason"])) {
    return { ok: false, message: "request body contains unsupported fields." };
  }

  const candidate = body as CancelContributionRequestBody;
  if (!isOptionalString(candidate.reason)) {
    return { ok: false, message: "reason must be a string when provided." };
  }

  return {
    ok: true,
    value: {
      ...(typeof candidate.reason === "string" ? { reason: candidate.reason.trim() } : {})
    }
  };
};

export const validateTransitionContributionBody = (
  body: unknown
): ValidationResult<TransitionContributionRequestBody> => {
  if (!isPlainObject(body)) {
    return { ok: false, message: "request body is required." };
  }
  if (!hasOnlyAllowedKeys(body, ["nextState", "reason"])) {
    return { ok: false, message: "request body contains unsupported fields." };
  }

  const candidate = body as Partial<TransitionContributionRequestBody>;
  if (!candidate.nextState || !contributionPostStates.includes(candidate.nextState)) {
    return { ok: false, message: "nextState must be a valid contribution state." };
  }
  if (!isOptionalString(candidate.reason)) {
    return { ok: false, message: "reason must be a string when provided." };
  }

  return {
    ok: true,
    value: {
      nextState: candidate.nextState,
      ...(typeof candidate.reason === "string" ? { reason: candidate.reason.trim() } : {})
    }
  };
};

export const validateSubmitApplicationBody = (
  body: unknown
): ValidationResult<SubmitApplicationRequestBody> => {
  if (!isPlainObject(body)) {
    return { ok: false, message: "request body is required." };
  }
  if (!hasOnlyAllowedKeys(body, ["message"])) {
    return { ok: false, message: "request body contains unsupported fields." };
  }

  const candidate = body as Partial<SubmitApplicationRequestBody>;
  if (!isNonEmptyString(candidate.message)) {
    return { ok: false, message: "message is required." };
  }

  return {
    ok: true,
    value: {
      message: candidate.message.trim()
    }
  };
};
