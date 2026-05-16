import type { ApiEnv } from "../../config/env";
import type { DatabaseClient, PersistenceRuntimeError } from "../../db/postgres";
import { log } from "../../observability/logger";

import {
  createAccessToken,
  createFutureIsoTimestamp,
  createRefreshToken,
  createSessionId,
  hashSessionToken,
  nowIsoTimestamp
} from "./token";
import type { AuthSessionRecord, RequestActor, SessionRole } from "./types";

type SessionRow = {
  id: string;
  user_id: string;
  role: SessionRole;
  state: "authenticated" | "expired";
  access_token_hash: string;
  refresh_token_hash: string;
  issued_at: string | Date;
  expires_at: string | Date;
  last_seen_at: string | Date;
  revoked_at: string | Date | null;
};

export type SessionStore = {
  create(input: { userId: string; role: SessionRole }): Promise<AuthSessionRecord>;
  resolveByAccessToken(accessToken: string): Promise<AuthSessionRecord | undefined>;
  resolveByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined>;
  rotateByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined>;
  revokeByAccessToken(accessToken: string): Promise<boolean>;
  revokeBySessionId(sessionId: string): Promise<boolean>;
  touch(sessionId: string): Promise<void>;
};

const isExpired = (session: AuthSessionRecord): boolean => {
  return new Date(session.expiresAt).getTime() <= Date.now();
};

const toIsoString = (value: string | Date | null | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value.toISOString() : value;
};

const toSessionRecord = (
  row: SessionRow,
  tokens?: { accessToken: string; refreshToken: string }
): AuthSessionRecord => {
  const accessToken = tokens?.accessToken ?? "OPEN_DECISION_REDACTED";
  const refreshToken = tokens?.refreshToken ?? "OPEN_DECISION_REDACTED";

  const baseRecord: AuthSessionRecord = {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    state: row.state,
    accessToken,
    refreshToken,
    issuedAt: toIsoString(row.issued_at) ?? nowIsoTimestamp(),
    expiresAt: toIsoString(row.expires_at) ?? nowIsoTimestamp(),
    lastSeenAt: toIsoString(row.last_seen_at) ?? nowIsoTimestamp()
  };

  const revokedAt = toIsoString(row.revoked_at);
  if (revokedAt) {
    baseRecord.revokedAt = revokedAt;
  }

  return baseRecord;
};

const toActor = (session: AuthSessionRecord): RequestActor => {
  if (session.revokedAt || isExpired(session) || session.state !== "authenticated") {
    return {
      actorType: "anonymous",
      role: "public",
      sessionState: "expired"
    };
  }

  return {
    actorType: "authenticated",
    role: session.role,
    sessionState: "authenticated",
    userId: session.userId
  };
};

class InMemorySessionStore implements SessionStore {
  private readonly sessionsById = new Map<string, AuthSessionRecord>();
  private readonly sessionIdByAccessTokenHash = new Map<string, string>();
  private readonly sessionIdByRefreshTokenHash = new Map<string, string>();

  constructor(private readonly ttlMinutes: number) {}

  async create(input: { userId: string; role: SessionRole }): Promise<AuthSessionRecord> {
    const issuedAt = nowIsoTimestamp();
    const session: AuthSessionRecord = {
      id: createSessionId(),
      userId: input.userId,
      role: input.role,
      state: "authenticated",
      accessToken: createAccessToken(),
      refreshToken: createRefreshToken(),
      issuedAt,
      expiresAt: createFutureIsoTimestamp(this.ttlMinutes),
      lastSeenAt: issuedAt
    };

    this.sessionsById.set(session.id, session);
    this.sessionIdByAccessTokenHash.set(hashSessionToken(session.accessToken), session.id);
    this.sessionIdByRefreshTokenHash.set(hashSessionToken(session.refreshToken), session.id);
    return session;
  }

  async resolveByAccessToken(accessToken: string): Promise<AuthSessionRecord | undefined> {
    const accessTokenHash = hashSessionToken(accessToken);
    const sessionId = this.sessionIdByAccessTokenHash.get(accessTokenHash);
    if (!sessionId) {
      return undefined;
    }
    return this.sessionsById.get(sessionId);
  }

  async resolveByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined> {
    const refreshTokenHash = hashSessionToken(refreshToken);
    const sessionId = this.sessionIdByRefreshTokenHash.get(refreshTokenHash);
    if (!sessionId) {
      return undefined;
    }
    return this.sessionsById.get(sessionId);
  }

  async rotateByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined> {
    const session = await this.resolveByRefreshToken(refreshToken);
    if (!session || session.revokedAt || isExpired(session)) {
      return undefined;
    }

    this.sessionIdByAccessTokenHash.delete(hashSessionToken(session.accessToken));
    this.sessionIdByRefreshTokenHash.delete(hashSessionToken(session.refreshToken));

    const rotated: AuthSessionRecord = {
      ...session,
      accessToken: createAccessToken(),
      refreshToken: createRefreshToken(),
      lastSeenAt: nowIsoTimestamp(),
      expiresAt: createFutureIsoTimestamp(this.ttlMinutes)
    };

    this.sessionsById.set(rotated.id, rotated);
    this.sessionIdByAccessTokenHash.set(hashSessionToken(rotated.accessToken), rotated.id);
    this.sessionIdByRefreshTokenHash.set(hashSessionToken(rotated.refreshToken), rotated.id);
    return rotated;
  }

  async revokeByAccessToken(accessToken: string): Promise<boolean> {
    const session = await this.resolveByAccessToken(accessToken);
    if (!session) {
      return false;
    }
    return this.revokeBySessionId(session.id);
  }

  async revokeBySessionId(sessionId: string): Promise<boolean> {
    const session = this.sessionsById.get(sessionId);
    if (!session || session.revokedAt) {
      return false;
    }

    const revoked: AuthSessionRecord = {
      ...session,
      state: "expired",
      revokedAt: nowIsoTimestamp()
    };
    this.sessionsById.set(sessionId, revoked);
    return true;
  }

  async touch(sessionId: string): Promise<void> {
    const session = this.sessionsById.get(sessionId);
    if (!session || session.revokedAt) {
      return;
    }
    this.sessionsById.set(sessionId, {
      ...session,
      lastSeenAt: nowIsoTimestamp()
    });
  }
}

class PostgresSessionStore implements SessionStore {
  constructor(
    private readonly client: DatabaseClient,
    private readonly ttlMinutes: number
  ) {}

  async create(input: { userId: string; role: SessionRole }): Promise<AuthSessionRecord> {
    const issuedAt = nowIsoTimestamp();
    const session: AuthSessionRecord = {
      id: createSessionId(),
      userId: input.userId,
      role: input.role,
      state: "authenticated",
      accessToken: createAccessToken(),
      refreshToken: createRefreshToken(),
      issuedAt,
      expiresAt: createFutureIsoTimestamp(this.ttlMinutes),
      lastSeenAt: issuedAt
    };

    await this.client.query(
      `insert into auth_sessions
       (id, user_id, role, state, access_token_hash, refresh_token_hash, issued_at, expires_at, last_seen_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        session.id,
        session.userId,
        session.role,
        session.state,
        hashSessionToken(session.accessToken),
        hashSessionToken(session.refreshToken),
        session.issuedAt,
        session.expiresAt,
        session.lastSeenAt
      ]
    );

    return session;
  }

  async resolveByAccessToken(accessToken: string): Promise<AuthSessionRecord | undefined> {
    const accessTokenHash = hashSessionToken(accessToken);
    const result = await this.client.query<SessionRow>(
      `select id, user_id, role, state, access_token_hash, refresh_token_hash, issued_at, expires_at, last_seen_at, revoked_at
       from auth_sessions
       where access_token_hash = $1
       limit 1`,
      [accessTokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      return undefined;
    }

    return toSessionRecord(row, {
      accessToken,
      refreshToken: "OPEN_DECISION_REDACTED"
    });
  }

  async resolveByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined> {
    const refreshTokenHash = hashSessionToken(refreshToken);
    const result = await this.client.query<SessionRow>(
      `select id, user_id, role, state, access_token_hash, refresh_token_hash, issued_at, expires_at, last_seen_at, revoked_at
       from auth_sessions
       where refresh_token_hash = $1
       limit 1`,
      [refreshTokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      return undefined;
    }

    return toSessionRecord(row, {
      accessToken: "OPEN_DECISION_REDACTED",
      refreshToken
    });
  }

  async rotateByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined> {
    const session = await this.resolveByRefreshToken(refreshToken);
    if (!session || session.revokedAt || isExpired(session)) {
      return undefined;
    }

    const accessToken = createAccessToken();
    const nextRefreshToken = createRefreshToken();
    const nextExpiresAt = createFutureIsoTimestamp(this.ttlMinutes);
    const updatedAt = nowIsoTimestamp();

    const result = await this.client.query<SessionRow>(
      `update auth_sessions
       set access_token_hash = $1,
           refresh_token_hash = $2,
           expires_at = $3,
           last_seen_at = $4
       where id = $5 and revoked_at is null
       returning id, user_id, role, state, access_token_hash, refresh_token_hash, issued_at, expires_at, last_seen_at, revoked_at`,
      [
        hashSessionToken(accessToken),
        hashSessionToken(nextRefreshToken),
        nextExpiresAt,
        updatedAt,
        session.id
      ]
    );

    const row = result.rows[0];
    if (!row) {
      return undefined;
    }

    return toSessionRecord(row, {
      accessToken,
      refreshToken: nextRefreshToken
    });
  }

  async revokeByAccessToken(accessToken: string): Promise<boolean> {
    const existing = await this.resolveByAccessToken(accessToken);
    if (!existing || existing.revokedAt) {
      return false;
    }

    await this.client.query(
      `update auth_sessions
       set state = 'expired',
           revoked_at = $1
       where access_token_hash = $2 and revoked_at is null`,
      [nowIsoTimestamp(), hashSessionToken(accessToken)]
    );

    return true;
  }

  async revokeBySessionId(sessionId: string): Promise<boolean> {
    const result = await this.client.query<SessionRow>(
      `select id, user_id, role, state, access_token_hash, refresh_token_hash, issued_at, expires_at, last_seen_at, revoked_at
       from auth_sessions
       where id = $1
       limit 1`,
      [sessionId]
    );
    const current = result.rows[0];
    if (!current || current.revoked_at) {
      return false;
    }

    await this.client.query(
      `update auth_sessions
       set state = 'expired',
           revoked_at = $1
       where id = $2 and revoked_at is null`,
      [nowIsoTimestamp(), sessionId]
    );

    return true;
  }

  async touch(sessionId: string): Promise<void> {
    await this.client.query(
      `update auth_sessions
       set last_seen_at = $1
       where id = $2 and revoked_at is null`,
      [nowIsoTimestamp(), sessionId]
    );
  }
}

export type SessionResolver = {
  resolveActorByAccessToken(accessToken: string | undefined): Promise<RequestActor | undefined>;
};

class DefaultSessionResolver implements SessionResolver {
  constructor(private readonly sessionStore: SessionStore) {}

  async resolveActorByAccessToken(
    accessToken: string | undefined
  ): Promise<RequestActor | undefined> {
    if (!accessToken) {
      return undefined;
    }
    const session = await this.sessionStore.resolveByAccessToken(accessToken);
    if (!session) {
      return undefined;
    }
    await this.sessionStore.touch(session.id);
    return toActor(session);
  }
}

export type AuthSessionRuntime = {
  sessionStore: SessionStore;
  sessionResolver: SessionResolver;
  mode: "memory" | "database" | "database_with_fallback";
};

export const createInMemorySessionStore = (env: ApiEnv): SessionStore => {
  return new InMemorySessionStore(env.sessionTtlMinutes);
};

export const createDbSessionStore = (client: DatabaseClient, env: ApiEnv): SessionStore => {
  return new PostgresSessionStore(client, env.sessionTtlMinutes);
};

const isPersistenceRuntimeError = (error: unknown): error is PersistenceRuntimeError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "PersistenceRuntimeError"
  );
};

class ResilientSessionStore implements SessionStore {
  private usingFallback = false;

  constructor(
    private readonly primary: SessionStore,
    private readonly fallback: SessionStore
  ) {}

  private get activeStore(): SessionStore {
    return this.usingFallback ? this.fallback : this.primary;
  }

  private activateFallback(error: unknown): void {
    if (this.usingFallback) {
      return;
    }

    this.usingFallback = true;
    const runtimeError = isPersistenceRuntimeError(error) ? error : undefined;

    log("error", "Auth session persistence failed. Falling back to in-memory session store.", {
      code: runtimeError?.code ?? "UNKNOWN_RUNTIME_ERROR",
      message: runtimeError?.message ?? (error instanceof Error ? error.message : "unknown")
    });
  }

  private async runWithFallback<T>(operation: (store: SessionStore) => Promise<T>): Promise<T> {
    if (this.usingFallback) {
      return operation(this.fallback);
    }

    try {
      return await operation(this.primary);
    } catch (error) {
      this.activateFallback(error);
      return operation(this.fallback);
    }
  }

  async create(input: { userId: string; role: SessionRole }): Promise<AuthSessionRecord> {
    return this.runWithFallback((store) => store.create(input));
  }

  async resolveByAccessToken(accessToken: string): Promise<AuthSessionRecord | undefined> {
    return this.runWithFallback((store) => store.resolveByAccessToken(accessToken));
  }

  async resolveByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined> {
    return this.runWithFallback((store) => store.resolveByRefreshToken(refreshToken));
  }

  async rotateByRefreshToken(refreshToken: string): Promise<AuthSessionRecord | undefined> {
    return this.runWithFallback((store) => store.rotateByRefreshToken(refreshToken));
  }

  async revokeByAccessToken(accessToken: string): Promise<boolean> {
    return this.runWithFallback((store) => store.revokeByAccessToken(accessToken));
  }

  async revokeBySessionId(sessionId: string): Promise<boolean> {
    return this.runWithFallback((store) => store.revokeBySessionId(sessionId));
  }

  async touch(sessionId: string): Promise<void> {
    await this.runWithFallback((store) => store.touch(sessionId));
  }

  getMode(): "database" | "database_with_fallback" {
    return this.usingFallback ? "database_with_fallback" : "database";
  }
}

export const createAuthSessionRuntime = (
  env: ApiEnv,
  dependencies: { databaseClient?: DatabaseClient } = {}
): AuthSessionRuntime => {
  if (!dependencies.databaseClient) {
    const sessionStore = createInMemorySessionStore(env);
    return {
      sessionStore,
      sessionResolver: new DefaultSessionResolver(sessionStore),
      mode: "memory"
    };
  }

  const dbStore = createDbSessionStore(dependencies.databaseClient, env);
  const memoryStore = createInMemorySessionStore(env);
  const resilientStore = new ResilientSessionStore(dbStore, memoryStore);

  return {
    sessionStore: resilientStore,
    sessionResolver: new DefaultSessionResolver(resilientStore),
    mode: resilientStore.getMode()
  };
};
