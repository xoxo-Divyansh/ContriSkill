import { createHash, randomUUID } from "node:crypto";

import type { RefreshToken, SessionIdentifier, SessionToken } from "./types";

const accessTokenPrefix = "atk";
const refreshTokenPrefix = "rtk";
const sessionPrefix = "ses";

const createOpaqueToken = (prefix: string): string => {
  return `${prefix}_${randomUUID()}`;
};

export const createAccessToken = (): SessionToken => {
  return createOpaqueToken(accessTokenPrefix);
};

export const createRefreshToken = (): RefreshToken => {
  return createOpaqueToken(refreshTokenPrefix);
};

export const createSessionId = (): SessionIdentifier => {
  return createOpaqueToken(sessionPrefix);
};

export const createFutureIsoTimestamp = (minutesFromNow: number): string => {
  const currentTimeMs = Date.now();
  const futureTimeMs = currentTimeMs + minutesFromNow * 60 * 1000;
  return new Date(futureTimeMs).toISOString();
};

export const nowIsoTimestamp = (): string => {
  return new Date().toISOString();
};

export const hashSessionToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};
