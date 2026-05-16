export type LogLevel = "debug" | "info" | "warn" | "error";

export const log = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  const entry = {
    level,
    message,
    context: context ?? {}
  };

  console.log(JSON.stringify(entry));
};
