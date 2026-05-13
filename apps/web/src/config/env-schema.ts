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
  wsCorsOrigin: "WS_CORS_ORIGIN"
} as const satisfies typeof SharedEnvKeys;

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
    throw new Error(`[env] Missing required environment variable "${key}".`);
  }
  return value;
};

export type WebEnv = {
  appName: string;
  apiBaseUrl: string;
};

export const parseWebEnv = (raw: NodeJS.ProcessEnv): WebEnv => {
  const appName = getOptionalString(raw, sharedEnvKeys.webAppName) ?? "ContriSkill";
  const apiBaseUrl = parseUrl(
    sharedEnvKeys.webApiBaseUrl,
    getRequiredString(raw, sharedEnvKeys.webApiBaseUrl)
  );

  return {
    appName,
    apiBaseUrl
  };
};
