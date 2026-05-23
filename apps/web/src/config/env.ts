import {
  getWebStartupDiagnostics,
  parseWebEnv,
  type WebEnv,
  type WebRuntimeEnv,
  type WebStartupDiagnostics
} from "./env-schema";

let cachedEnv: WebEnv | undefined;
let cachedRuntimeEnv: WebRuntimeEnv | undefined;
let hasLoggedStartupDiagnostics = false;

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
    cachedRuntimeEnv = readWebRuntimeEnv();
    cachedEnv = parseWebEnv(cachedRuntimeEnv);
  }

  if (!hasLoggedStartupDiagnostics && process.env.NODE_ENV !== "production") {
    const startupDiagnostics = getWebStartupDiagnostics(
      cachedEnv,
      cachedRuntimeEnv ?? readWebRuntimeEnv()
    );
    console.info("[env] Web runtime configuration validated.", startupDiagnostics);
    hasLoggedStartupDiagnostics = true;
  }

  return cachedEnv;
};

export const describeWebEnvStartup = (): WebStartupDiagnostics => {
  const runtimeEnv = cachedRuntimeEnv ?? readWebRuntimeEnv();
  const env = cachedEnv ?? parseWebEnv(runtimeEnv);
  return getWebStartupDiagnostics(env, runtimeEnv);
};
