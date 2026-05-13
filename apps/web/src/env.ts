export type WebEnv = {
  appName: string;
  apiBaseUrl: string;
};

export const webEnv: WebEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "ContriSkill",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
};
