import type { sharedEnvKeys as SharedEnvKeys } from "@contriskill/config";

const sharedEnvKeys = {
  nodeEnv: "NODE_ENV",
  logLevel: "LOG_LEVEL",
  apiPort: "API_PORT",
  jwtAccessSecret: "JWT_ACCESS_SECRET",
  jwtRefreshSecret: "JWT_REFRESH_SECRET",
  sessionTtlMinutes: "SESSION_TTL_MINUTES",
  databaseUrl: "DATABASE_URL",
  webAppName: "NEXT_PUBLIC_APP_NAME",
  webApiBaseUrl: "NEXT_PUBLIC_API_BASE_URL",
  webRealtimeUrl: "NEXT_PUBLIC_REALTIME_URL",
  wsCorsOrigin: "WS_CORS_ORIGIN"
} as const satisfies typeof SharedEnvKeys;

type NodeEnv = "development" | "test" | "production";
type LogLevel = "debug" | "info" | "warn" | "error";

const nodeEnvValues: NodeEnv[] = ["development", "test", "production"];
const logLevelValues: LogLevel[] = ["debug", "info", "warn", "error"];

const isOneOf = <T extends string>(value: string, allowed: readonly T[]): value is T => {
  return allowed.includes(value as T);
};

const parseInteger = (key: string, value: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`[env] ${key} must be an integer. Received "${value}".`);
  }
  return parsed;
};

const parseUrl = (key: string, value: string): string => {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new Error(`[env] ${key} must be a valid URL. Received "${value}".`);
  }
};

const getOptionalString = (raw: NodeJS.ProcessEnv, key: string): string | undefined => {
  const value = raw[key];
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getRequiredString = (raw: NodeJS.ProcessEnv, key: string): string => {
  const value = getOptionalString(raw, key);
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable "${key}". ` +
        `Set it in apps/api/.env.local (see apps/api/.env.example).`
    );
  }
  return value;
};

const getNodeEnv = (raw: NodeJS.ProcessEnv): NodeEnv => {
  const rawValue = raw[sharedEnvKeys.nodeEnv] ?? "development";
  if (!isOneOf(rawValue, nodeEnvValues)) {
    throw new Error(
      `[env] ${sharedEnvKeys.nodeEnv} must be one of: ${nodeEnvValues.join(", ")}. Received "${rawValue}".`
    );
  }
  return rawValue;
};

const getLogLevel = (raw: NodeJS.ProcessEnv): LogLevel => {
  const rawValue = raw[sharedEnvKeys.logLevel] ?? "info";
  if (!isOneOf(rawValue, logLevelValues)) {
    throw new Error(
      `[env] ${sharedEnvKeys.logLevel} must be one of: ${logLevelValues.join(", ")}. Received "${rawValue}".`
    );
  }
  return rawValue;
};

const getApiPort = (raw: NodeJS.ProcessEnv): number => {
  const key = sharedEnvKeys.apiPort;
  const rawValue = raw[key] ?? "4000";
  const port = parseInteger(key, rawValue);
  if (port < 1 || port > 65535) {
    throw new Error(`[env] ${key} must be between 1 and 65535. Received "${rawValue}".`);
  }
  return port;
};

const getSessionTtlMinutes = (raw: NodeJS.ProcessEnv): number => {
  const key = sharedEnvKeys.sessionTtlMinutes;
  const rawValue = raw[key] ?? "30";
  const ttl = parseInteger(key, rawValue);
  if (ttl < 1) {
    throw new Error(`[env] ${key} must be >= 1. Received "${rawValue}".`);
  }
  return ttl;
};

const getRequiredProductionSecrets = (raw: NodeJS.ProcessEnv, nodeEnv: NodeEnv): void => {
  if (nodeEnv !== "production") {
    return;
  }

  getRequiredString(raw, sharedEnvKeys.databaseUrl);
  getRequiredString(raw, sharedEnvKeys.jwtAccessSecret);
  getRequiredString(raw, sharedEnvKeys.jwtRefreshSecret);
};

export type ApiEnv = {
  nodeEnv: NodeEnv;
  logLevel: LogLevel;
  port: number;
  wsCorsOrigin: string;
  sessionTtlMinutes: number;
  databaseUrl?: string;
  jwtAccessSecret?: string;
  jwtRefreshSecret?: string;
};

export type ApiStartupDiagnostics = {
  nodeEnv: NodeEnv;
  logLevel: LogLevel;
  port: number;
  wsCorsOrigin: string;
  sessionTtlMinutes: number;
  hasDatabaseUrl: boolean;
  hasJwtAccessSecret: boolean;
  hasJwtRefreshSecret: boolean;
  authMode: "database" | "stateless";
};

export const parseApiEnv = (raw: NodeJS.ProcessEnv): ApiEnv => {
  const nodeEnv = getNodeEnv(raw);
  getRequiredProductionSecrets(raw, nodeEnv);

  const wsCorsOrigin = parseUrl(
    sharedEnvKeys.wsCorsOrigin,
    raw[sharedEnvKeys.wsCorsOrigin] ?? "http://localhost:3000"
  );

  const databaseUrl = getOptionalString(raw, sharedEnvKeys.databaseUrl);
  const jwtAccessSecret = getOptionalString(raw, sharedEnvKeys.jwtAccessSecret);
  const jwtRefreshSecret = getOptionalString(raw, sharedEnvKeys.jwtRefreshSecret);

  const env: ApiEnv = {
    nodeEnv,
    logLevel: getLogLevel(raw),
    port: getApiPort(raw),
    wsCorsOrigin,
    sessionTtlMinutes: getSessionTtlMinutes(raw)
  };

  if (databaseUrl) {
    env.databaseUrl = databaseUrl;
  }

  if (jwtAccessSecret) {
    env.jwtAccessSecret = jwtAccessSecret;
  }

  if (jwtRefreshSecret) {
    env.jwtRefreshSecret = jwtRefreshSecret;
  }

  return env;
};

export const getApiStartupDiagnostics = (env: ApiEnv): ApiStartupDiagnostics => {
  const hasDatabaseUrl = Boolean(env.databaseUrl);
  const hasJwtAccessSecret = Boolean(env.jwtAccessSecret);
  const hasJwtRefreshSecret = Boolean(env.jwtRefreshSecret);
  const authMode = hasDatabaseUrl ? "database" : "stateless";

  return {
    nodeEnv: env.nodeEnv,
    logLevel: env.logLevel,
    port: env.port,
    wsCorsOrigin: env.wsCorsOrigin,
    sessionTtlMinutes: env.sessionTtlMinutes,
    hasDatabaseUrl,
    hasJwtAccessSecret,
    hasJwtRefreshSecret,
    authMode
  };
};
