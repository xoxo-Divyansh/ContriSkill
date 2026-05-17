import { Pool, type QueryResultRow } from "pg";

import type { ApiEnv } from "../config/env";
import { log } from "../observability/logger";

export type DatabaseClient = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }>;
  transaction?<T>(work: (client: DatabaseClient) => Promise<T>): Promise<T>;
};

export type PersistenceRuntimeErrorCode =
  | "INVALID_DATABASE_URL"
  | "DB_CONNECTION_FAILED"
  | "MISSING_AUTH_SESSIONS_TABLE"
  | "DB_QUERY_FAILED";

export class PersistenceRuntimeError extends Error {
  public override readonly cause?: unknown;

  constructor(
    public readonly code: PersistenceRuntimeErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = "PersistenceRuntimeError";
    this.cause = cause;
  }
}

type PgLikeError = {
  code?: string;
  message?: string;
};

const isPgLikeError = (value: unknown): value is PgLikeError => {
  return typeof value === "object" && value !== null && "message" in value;
};

const mapPersistenceError = (error: unknown): PersistenceRuntimeError => {
  if (isPgLikeError(error) && error.code === "42P01") {
    return new PersistenceRuntimeError(
      "MISSING_AUTH_SESSIONS_TABLE",
      "auth_sessions table does not exist.",
      error
    );
  }

  if (isPgLikeError(error)) {
    return new PersistenceRuntimeError(
      "DB_QUERY_FAILED",
      error.message ?? "Database query failed.",
      error
    );
  }

  return new PersistenceRuntimeError("DB_QUERY_FAILED", "Database query failed.", error);
};

class PostgresClient implements DatabaseClient {
  constructor(private readonly pool: Pool) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<{ rows: T[] }> {
    try {
      const result = await this.pool.query<T>(text, [...values]);
      return {
        rows: result.rows
      };
    } catch (error) {
      throw mapPersistenceError(error);
    }
  }

  async transaction<T>(work: (client: DatabaseClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const transactionalClient: DatabaseClient = {
        query: async <TRow extends QueryResultRow = QueryResultRow>(
          text: string,
          values: readonly unknown[] = []
        ): Promise<{ rows: TRow[] }> => {
          try {
            const result = await client.query<TRow>(text, [...values]);
            return { rows: result.rows };
          } catch (error) {
            throw mapPersistenceError(error);
          }
        }
      };
      const result = await work(transactionalClient);
      await client.query("commit");
      return result;
    } catch (error) {
      try {
        await client.query("rollback");
      } catch (rollbackError) {
        log("error", "Failed to rollback database transaction.", {
          error: rollbackError instanceof Error ? rollbackError.message : "unknown"
        });
      }
      throw error;
    } finally {
      client.release();
    }
  }
}

export const createPostgresClient = (env: ApiEnv): DatabaseClient | undefined => {
  if (!env.databaseUrl) {
    log("info", "DATABASE_URL not provided. Using non-DB auth session mode.");
    return undefined;
  }

  try {
    new URL(env.databaseUrl);
  } catch (error) {
    log("error", "Invalid DATABASE_URL; auth session runtime will fallback to in-memory mode.", {
      error: error instanceof Error ? error.message : "unknown"
    });
    return undefined;
  }

  let pool: Pool;
  try {
    pool = new Pool({
      connectionString: env.databaseUrl
    });
  } catch (error) {
    log("error", "Failed to initialize Postgres client; falling back to in-memory session mode.", {
      error: error instanceof Error ? error.message : "unknown"
    });
    return undefined;
  }

  return new PostgresClient(pool);
};
