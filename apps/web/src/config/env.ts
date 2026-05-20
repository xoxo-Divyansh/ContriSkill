import { parseWebEnv, type WebEnv, type WebRuntimeEnv } from "./env-schema";

let cachedEnv: WebEnv | undefined;

const readWebRuntimeEnv = (): WebRuntimeEnv => {
  return {
    ...(process.env.NEXT_PUBLIC_APP_NAME
      ? { NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME }
      : {}),
    ...(process.env.NEXT_PUBLIC_API_BASE_URL
      ? { NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL }
      : {}),
    ...(process.env.NEXT_PUBLIC_REALTIME_URL
      ? { NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL }
      : {})
  };
};

export const getWebEnv = (): WebEnv => {
  if (!cachedEnv) {
    cachedEnv = parseWebEnv(readWebRuntimeEnv());
  }

  return cachedEnv;
};
