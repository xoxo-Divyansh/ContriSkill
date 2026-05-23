import {
  getApiStartupDiagnostics,
  parseApiEnv,
  type ApiEnv,
  type ApiStartupDiagnostics
} from "./env-schema";

export type { ApiEnv } from "./env-schema";
export type { ApiStartupDiagnostics } from "./env-schema";

let cachedEnv: ApiEnv | undefined;

export const getApiEnv = (): ApiEnv => {
  if (!cachedEnv) {
    cachedEnv = parseApiEnv(process.env);
  }

  return cachedEnv;
};

export const describeApiEnvStartup = (): ApiStartupDiagnostics => {
  const env = getApiEnv();
  return getApiStartupDiagnostics(env);
};
