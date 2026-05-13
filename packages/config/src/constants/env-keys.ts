export const sharedEnvKeys = {
  nodeEnv: "NODE_ENV",
  apiPort: "API_PORT",
  databaseUrl: "DATABASE_URL",
  webApiBaseUrl: "NEXT_PUBLIC_API_BASE_URL",
  wsCorsOrigin: "WS_CORS_ORIGIN"
} as const;

export type SharedEnvKey = (typeof sharedEnvKeys)[keyof typeof sharedEnvKeys];
