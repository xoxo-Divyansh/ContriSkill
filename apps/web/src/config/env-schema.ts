const webEnvKeys = {
  apiBaseUrl: "NEXT_PUBLIC_API_BASE_URL",
  realtimeUrl: "NEXT_PUBLIC_REALTIME_URL"
} as const;

const parseUrl = (key: string, value: string): string => {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new Error(`[env] ${key} must be a valid URL. Received "${value}".`);
  }
};

export type WebRuntimeEnv = {
  NEXT_PUBLIC_APP_NAME?: string;
  NEXT_PUBLIC_API_BASE_URL?: string;
  NEXT_PUBLIC_REALTIME_URL?: string;
};

const WEB_ENV_EXAMPLE_PATH = "apps/web/.env.example";

const getOptionalString = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getRequiredString = (value: string | undefined, key: string): string => {
  const normalizedValue = getOptionalString(value);
  if (!normalizedValue) {
    throw new Error(
      `[env] Missing required environment variable "${key}". ` +
        `Set it in apps/web/.env.local (see ${WEB_ENV_EXAMPLE_PATH}).`
    );
  }
  return normalizedValue;
};

export type WebEnv = {
  appName: string;
  apiBaseUrl: string;
  realtimeUrl: string;
};

export type WebStartupDiagnostics = {
  appName: string;
  apiBaseUrl: string;
  realtimeUrl: string;
  hasExplicitRealtimeUrl: boolean;
};

const toWebSocketUrl = (apiBaseUrl: string): string => {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/v1/realtime";
  url.search = "";
  return url.toString();
};

export const parseWebEnv = (raw: WebRuntimeEnv): WebEnv => {
  const appName = getOptionalString(raw.NEXT_PUBLIC_APP_NAME) ?? "ContriSkill";
  const apiBaseUrl = parseUrl(
    webEnvKeys.apiBaseUrl,
    getRequiredString(raw.NEXT_PUBLIC_API_BASE_URL, webEnvKeys.apiBaseUrl)
  );
  const realtimeUrl = parseUrl(
    webEnvKeys.realtimeUrl,
    getOptionalString(raw.NEXT_PUBLIC_REALTIME_URL) ?? toWebSocketUrl(apiBaseUrl)
  );

  return {
    appName,
    apiBaseUrl,
    realtimeUrl
  };
};

export const getWebStartupDiagnostics = (
  env: WebEnv,
  raw: WebRuntimeEnv
): WebStartupDiagnostics => {
  return {
    appName: env.appName,
    apiBaseUrl: env.apiBaseUrl,
    realtimeUrl: env.realtimeUrl,
    hasExplicitRealtimeUrl: Boolean(getOptionalString(raw.NEXT_PUBLIC_REALTIME_URL))
  };
};
