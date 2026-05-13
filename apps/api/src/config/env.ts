export type ApiEnv = {
  nodeEnv: string;
  port: number;
  wsCorsOrigin: string;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getApiEnv = (): ApiEnv => {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: toNumber(process.env.API_PORT, 4000),
    wsCorsOrigin: process.env.WS_CORS_ORIGIN ?? "http://localhost:3000"
  };
};
