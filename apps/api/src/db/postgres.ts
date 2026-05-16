import { Pool, type QueryResultRow } from "pg";

import type { ApiEnv } from "../config/env";

export type DatabaseClient = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }>;
};

class PostgresClient implements DatabaseClient {
  constructor(private readonly pool: Pool) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = []
  ): Promise<{ rows: T[] }> {
    const result = await this.pool.query<T>(text, [...values]);
    return {
      rows: result.rows
    };
  }
}

export const createPostgresClient = (env: ApiEnv): DatabaseClient | undefined => {
  if (!env.databaseUrl) {
    return undefined;
  }

  const pool = new Pool({
    connectionString: env.databaseUrl
  });

  return new PostgresClient(pool);
};
