import { randomUUID } from "node:crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContextValue = string | number | boolean | null | LogContextValue[] | LogContextRecord;
interface LogContextRecord {
  [key: string]: LogContextValue;
}

const logLevelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const redactedToken = "[redacted]";
const sensitiveKeyPattern = /(secret|token|password|authorization|cookie|session|jwt|api[-_]?key)/i;

const isLogContextRecord = (value: unknown): value is LogContextRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const sanitizeContextValue = (key: string, value: unknown): LogContextValue => {
  if (sensitiveKeyPattern.test(key)) {
    return redactedToken;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeContextValue(key, entry));
  }

  if (isLogContextRecord(value)) {
    const nested: LogContextRecord = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      nested[nestedKey] = sanitizeContextValue(nestedKey, nestedValue);
    }
    return nested;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return String(value);
};

export type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
};

type LoggerRuntime = {
  serviceName: string;
  environment: string;
  minimumLevel: LogLevel;
};

const runtime: LoggerRuntime = {
  serviceName: "api",
  environment: process.env.NODE_ENV ?? "development",
  minimumLevel: "info"
};

export const configureLogger = (nextRuntime: Partial<LoggerRuntime>): void => {
  if (nextRuntime.serviceName) {
    runtime.serviceName = nextRuntime.serviceName;
  }
  if (nextRuntime.environment) {
    runtime.environment = nextRuntime.environment;
  }
  if (nextRuntime.minimumLevel) {
    runtime.minimumLevel = nextRuntime.minimumLevel;
  }
};

const shouldLog = (level: LogLevel): boolean => {
  return logLevelWeight[level] >= logLevelWeight[runtime.minimumLevel];
};

const createEntry = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  const sanitizedContext: LogContextRecord = {};
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      sanitizedContext[key] = sanitizeContextValue(key, value);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    level,
    service: runtime.serviceName,
    env: runtime.environment,
    message,
    context: sanitizedContext
  };
};

export const log = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
  if (!shouldLog(level)) {
    return;
  }
  console.log(JSON.stringify(createEntry(level, message, context)));
};

export const createLogger = (baseContext: Record<string, unknown> = {}): Logger => {
  const write = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    log(level, message, { ...baseContext, ...(context ?? {}) });
  };

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context)
  };
};

export const createIncidentId = (): string => {
  return `inc_${randomUUID()}`;
};
