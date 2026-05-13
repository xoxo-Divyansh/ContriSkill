import { parseWebEnv, type WebEnv } from "./env-schema";

let cachedEnv: WebEnv | undefined;

export const getWebEnv = (): WebEnv => {
  if (!cachedEnv) {
    cachedEnv = parseWebEnv(process.env);
  }

  return cachedEnv;
};

export const webEnv = getWebEnv();
