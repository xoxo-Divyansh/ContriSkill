import type { ApiEnv } from "../../config/env";

import {
  createAccessToken,
  createFutureIsoTimestamp,
  createRefreshToken,
  createSessionId,
  nowIsoTimestamp
} from "./token";
import type { AuthSessionRecord, RequestActor, SessionRole } from "./types";

export type SessionStore = {
  create(input: { userId: string; role: SessionRole }): AuthSessionRecord;
  resolveByAccessToken(accessToken: string): AuthSessionRecord | undefined;
  resolveByRefreshToken(refreshToken: string): AuthSessionRecord | undefined;
  rotateByRefreshToken(refreshToken: string): AuthSessionRecord | undefined;
  revokeByAccessToken(accessToken: string): boolean;
  revokeBySessionId(sessionId: string): boolean;
  touch(sessionId: string): void;
};

const isExpired = (session: AuthSessionRecord): boolean => {
  return new Date(session.expiresAt).getTime() <= Date.now();
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
  private readonly sessionIdByAccessToken = new Map<string, string>();
  private readonly sessionIdByRefreshToken = new Map<string, string>();

  constructor(private readonly ttlMinutes: number) {}

  create(input: { userId: string; role: SessionRole }): AuthSessionRecord {
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
    this.sessionIdByAccessToken.set(session.accessToken, session.id);
    this.sessionIdByRefreshToken.set(session.refreshToken, session.id);
    return session;
  }

  resolveByAccessToken(accessToken: string): AuthSessionRecord | undefined {
    const sessionId = this.sessionIdByAccessToken.get(accessToken);
    if (!sessionId) {
      return undefined;
    }
    return this.sessionsById.get(sessionId);
  }

  resolveByRefreshToken(refreshToken: string): AuthSessionRecord | undefined {
    const sessionId = this.sessionIdByRefreshToken.get(refreshToken);
    if (!sessionId) {
      return undefined;
    }
    return this.sessionsById.get(sessionId);
  }

  rotateByRefreshToken(refreshToken: string): AuthSessionRecord | undefined {
    const session = this.resolveByRefreshToken(refreshToken);
    if (!session || session.revokedAt || isExpired(session)) {
      return undefined;
    }

    this.sessionIdByAccessToken.delete(session.accessToken);
    this.sessionIdByRefreshToken.delete(session.refreshToken);

    const rotated: AuthSessionRecord = {
      ...session,
      accessToken: createAccessToken(),
      refreshToken: createRefreshToken(),
      lastSeenAt: nowIsoTimestamp(),
      expiresAt: createFutureIsoTimestamp(this.ttlMinutes)
    };

    this.sessionsById.set(rotated.id, rotated);
    this.sessionIdByAccessToken.set(rotated.accessToken, rotated.id);
    this.sessionIdByRefreshToken.set(rotated.refreshToken, rotated.id);
    return rotated;
  }

  revokeByAccessToken(accessToken: string): boolean {
    const session = this.resolveByAccessToken(accessToken);
    if (!session) {
      return false;
    }
    return this.revokeBySessionId(session.id);
  }

  revokeBySessionId(sessionId: string): boolean {
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

  touch(sessionId: string): void {
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

export type SessionResolver = {
  resolveActorByAccessToken(accessToken: string | undefined): RequestActor | undefined;
};

class DefaultSessionResolver implements SessionResolver {
  constructor(private readonly sessionStore: SessionStore) {}

  resolveActorByAccessToken(accessToken: string | undefined): RequestActor | undefined {
    if (!accessToken) {
      return undefined;
    }
    const session = this.sessionStore.resolveByAccessToken(accessToken);
    if (!session) {
      return undefined;
    }
    this.sessionStore.touch(session.id);
    return toActor(session);
  }
}

export type AuthSessionRuntime = {
  sessionStore: SessionStore;
  sessionResolver: SessionResolver;
};

export const createAuthSessionRuntime = (env: ApiEnv): AuthSessionRuntime => {
  const sessionStore = new InMemorySessionStore(env.sessionTtlMinutes);
  return {
    sessionStore,
    sessionResolver: new DefaultSessionResolver(sessionStore)
  };
};
