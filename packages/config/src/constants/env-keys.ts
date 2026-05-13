export const sharedEnvKeys = {
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
} as const;

export type SharedEnvKey = (typeof sharedEnvKeys)[keyof typeof sharedEnvKeys];
