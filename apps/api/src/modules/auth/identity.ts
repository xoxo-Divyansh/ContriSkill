import { randomUUID } from "node:crypto";

import type { ApiEnv } from "../../config/env";
import type { DatabaseClient } from "../../db/postgres";
import { log } from "../../observability/logger";

import type { AuthRole } from "./types";

type IdentityRow = {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: AuthRole;
  status: "active";
  created_at: string | Date;
  updated_at: string | Date;
};

export type AuthIdentityRecord = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: AuthRole;
  status: "active";
  createdAt: string;
  updatedAt: string;
};

export type AuthIdentityRuntimeErrorCode =
  | "IDENTITY_ALREADY_EXISTS"
  | "IDENTITY_NOT_FOUND"
  | "INVALID_CREDENTIALS";

export class AuthIdentityRuntimeError extends Error {
  constructor(
    public readonly code: AuthIdentityRuntimeErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AuthIdentityRuntimeError";
  }
}

export type AuthIdentityRepository = {
  create(input: {
    email: string;
    username: string;
    passwordHash: string;
    role: AuthRole;
  }): Promise<AuthIdentityRecord>;
  findByIdentifier(identifier: string): Promise<AuthIdentityRecord | undefined>;
};

const toIsoString = (value: string | Date): string => {
  return value instanceof Date ? value.toISOString() : value;
};

const fromIdentityRow = (row: IdentityRow): AuthIdentityRecord => {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at)
  };
};

const createIdentityId = (): string => {
  return `usr_${randomUUID()}`;
};

class InMemoryIdentityRepository implements AuthIdentityRepository {
  private readonly recordsById = new Map<string, AuthIdentityRecord>();
  private readonly idByEmail = new Map<string, string>();
  private readonly idByUsername = new Map<string, string>();

  async create(input: {
    email: string;
    username: string;
    passwordHash: string;
    role: AuthRole;
  }): Promise<AuthIdentityRecord> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedUsername = input.username.trim().toLowerCase();

    if (this.idByEmail.has(normalizedEmail) || this.idByUsername.has(normalizedUsername)) {
      throw new AuthIdentityRuntimeError(
        "IDENTITY_ALREADY_EXISTS",
        "Identity with this email or username already exists."
      );
    }

    const now = new Date().toISOString();
    const identity: AuthIdentityRecord = {
      id: createIdentityId(),
      email: normalizedEmail,
      username: input.username.trim(),
      passwordHash: input.passwordHash,
      role: input.role,
      status: "active",
      createdAt: now,
      updatedAt: now
    };

    this.recordsById.set(identity.id, identity);
    this.idByEmail.set(normalizedEmail, identity.id);
    this.idByUsername.set(normalizedUsername, identity.id);

    return identity;
  }

  async findByIdentifier(identifier: string): Promise<AuthIdentityRecord | undefined> {
    const normalized = identifier.trim().toLowerCase();
    const idFromEmail = this.idByEmail.get(normalized);
    const idFromUsername = this.idByUsername.get(normalized);
    const identityId = idFromEmail ?? idFromUsername;

    if (!identityId) {
      return undefined;
    }

    return this.recordsById.get(identityId);
  }
}

class PostgresIdentityRepository implements AuthIdentityRepository {
  constructor(private readonly client: DatabaseClient) {}

  async create(input: {
    email: string;
    username: string;
    passwordHash: string;
    role: AuthRole;
  }): Promise<AuthIdentityRecord> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const identityId = createIdentityId();

    try {
      const result = await this.client.query<IdentityRow>(
        `insert into auth_identities
         (id, email, username, password_hash, role, status, created_at, updated_at)
         values ($1, $2, $3, $4, $5, 'active', now(), now())
         returning id, email, username, password_hash, role, status, created_at, updated_at`,
        [identityId, normalizedEmail, username, input.passwordHash, input.role]
      );

      const row = result.rows[0];
      if (!row) {
        throw new AuthIdentityRuntimeError("IDENTITY_NOT_FOUND", "Identity write result missing.");
      }

      return fromIdentityRow(row);
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError?.code === "23505") {
        throw new AuthIdentityRuntimeError(
          "IDENTITY_ALREADY_EXISTS",
          "Identity with this email or username already exists."
        );
      }
      throw error;
    }
  }

  async findByIdentifier(identifier: string): Promise<AuthIdentityRecord | undefined> {
    const normalized = identifier.trim().toLowerCase();
    const result = await this.client.query<IdentityRow>(
      `select id, email, username, password_hash, role, status, created_at, updated_at
       from auth_identities
       where lower(email) = $1 or lower(username) = $1
       limit 1`,
      [normalized]
    );

    const row = result.rows[0];
    if (!row) {
      return undefined;
    }

    return fromIdentityRow(row);
  }
}

class ResilientIdentityRepository implements AuthIdentityRepository {
  private usingFallback = false;

  constructor(
    private readonly primary: AuthIdentityRepository,
    private readonly fallback: AuthIdentityRepository
  ) {}

  private async runWithFallback<T>(
    operation: (repository: AuthIdentityRepository) => Promise<T>
  ): Promise<T> {
    if (this.usingFallback) {
      return operation(this.fallback);
    }

    try {
      return await operation(this.primary);
    } catch (error) {
      if (error instanceof AuthIdentityRuntimeError) {
        throw error;
      }

      this.usingFallback = true;
      log("error", "Auth identity persistence failed. Falling back to in-memory identity store.", {
        error: error instanceof Error ? error.message : "unknown"
      });
      return operation(this.fallback);
    }
  }

  async create(input: {
    email: string;
    username: string;
    passwordHash: string;
    role: AuthRole;
  }): Promise<AuthIdentityRecord> {
    return this.runWithFallback((repository) => repository.create(input));
  }

  async findByIdentifier(identifier: string): Promise<AuthIdentityRecord | undefined> {
    return this.runWithFallback((repository) => repository.findByIdentifier(identifier));
  }
}

export const createInMemoryIdentityRepository = (): AuthIdentityRepository => {
  return new InMemoryIdentityRepository();
};

export const createDbIdentityRepository = (
  databaseClient: DatabaseClient
): AuthIdentityRepository => {
  return new PostgresIdentityRepository(databaseClient);
};

export const createAuthIdentityRepository = (
  env: ApiEnv,
  dependencies: { databaseClient?: DatabaseClient } = {}
): AuthIdentityRepository => {
  void env;
  const fallback = createInMemoryIdentityRepository();
  if (!dependencies.databaseClient) {
    return fallback;
  }

  const dbRepository = createDbIdentityRepository(dependencies.databaseClient);
  return new ResilientIdentityRepository(dbRepository, fallback);
};
