import { parseApiEnv, type ApiEnv } from "./env-schema";

export type { ApiEnv } from "./env-schema";

let cachedEnv: ApiEnv | undefined;

export const getApiEnv = (): ApiEnv => {
  if (!cachedEnv) {
    cachedEnv = parseApiEnv(process.env);
  }

  return cachedEnv;
};
