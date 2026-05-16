import { describe, expect, it } from "vitest";

import type { DatabaseClient } from "../src/db/postgres";
import { createDbSessionStore } from "../src/modules/auth/session";
import { hashSessionToken } from "../src/modules/auth/token";

type QueryCall = {
  text: string;
  values: readonly unknown[] | undefined;
};

class FakeDatabaseClient implements DatabaseClient {
  private readonly rowsByAccessHash = new Map<string, Record<string, unknown>>();
  private readonly rowsByRefreshHash = new Map<string, Record<string, unknown>>();
  private readonly rowsById = new Map<string, Record<string, unknown>>();

  readonly calls: QueryCall[] = [];

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): Promise<{ rows: T[] }> {
    this.calls.push({ text, values });

    if (text.includes("insert into auth_sessions")) {
      const [
        id,
        userId,
        role,
        state,
        accessTokenHash,
        refreshTokenHash,
        issuedAt,
        expiresAt,
        lastSeenAt
      ] = values ?? [];

      const row: Record<string, unknown> = {
        id,
        user_id: userId,
        role,
        state,
        access_token_hash: accessTokenHash,
        refresh_token_hash: refreshTokenHash,
        issued_at: issuedAt,
        expires_at: expiresAt,
        last_seen_at: lastSeenAt,
        revoked_at: null
      };
      this.rowsById.set(String(id), row);
      this.rowsByAccessHash.set(String(accessTokenHash), row);
      this.rowsByRefreshHash.set(String(refreshTokenHash), row);
      return { rows: [] as T[] };
    }

    if (text.includes("where access_token_hash = $1")) {
      const row = this.rowsByAccessHash.get(String(values?.[0]));
      return { rows: (row ? [row] : []) as T[] };
    }

    if (text.includes("where refresh_token_hash = $1")) {
      const row = this.rowsByRefreshHash.get(String(values?.[0]));
      return { rows: (row ? [row] : []) as T[] };
    }

    if (text.includes("where id = $1")) {
      const row = this.rowsById.get(String(values?.[0]));
      return { rows: (row ? [row] : []) as T[] };
    }

    if (text.includes("set access_token_hash = $1")) {
      const [nextAccessHash, nextRefreshHash, nextExpiresAt, nextLastSeenAt, id] = values ?? [];
      const row = this.rowsById.get(String(id));
      if (!row) {
        return { rows: [] as T[] };
      }
      row.access_token_hash = nextAccessHash;
      row.refresh_token_hash = nextRefreshHash;
      row.expires_at = nextExpiresAt;
      row.last_seen_at = nextLastSeenAt;
      this.rowsByAccessHash.set(String(nextAccessHash), row);
      this.rowsByRefreshHash.set(String(nextRefreshHash), row);
      return { rows: [row as T] };
    }

    if (text.includes("set state = 'expired'")) {
      return { rows: [] as T[] };
    }

    if (text.includes("set last_seen_at = $1")) {
      const [nextLastSeenAt, id] = values ?? [];
      const row = this.rowsById.get(String(id));
      if (row) {
        row.last_seen_at = nextLastSeenAt;
      }
      return { rows: [] as T[] };
    }

    return { rows: [] as T[] };
  }
}

describe("db session store foundation", () => {
  it("stores hashed tokens instead of raw tokens", async () => {
    const client = new FakeDatabaseClient();
    const store = createDbSessionStore(client, {
      nodeEnv: "test",
      logLevel: "info",
      port: 4000,
      wsCorsOrigin: "http://localhost:3000",
      sessionTtlMinutes: 30
    });

    const session = await store.create({
      userId: "usr_test",
      role: "user"
    });

    const insertCall = client.calls.find((call) => call.text.includes("insert into auth_sessions"));
    expect(insertCall).toBeDefined();
    expect(insertCall?.values).toBeDefined();
    expect(insertCall?.values?.[4]).toBe(hashSessionToken(session.accessToken));
    expect(insertCall?.values?.[4]).not.toBe(session.accessToken);
    expect(insertCall?.values?.[5]).toBe(hashSessionToken(session.refreshToken));
    expect(insertCall?.values?.[5]).not.toBe(session.refreshToken);
  });

  it("creates and rotates persisted session tokens", async () => {
    const client = new FakeDatabaseClient();
    const store = createDbSessionStore(client, {
      nodeEnv: "test",
      logLevel: "info",
      port: 4000,
      wsCorsOrigin: "http://localhost:3000",
      sessionTtlMinutes: 30
    });

    const created = await store.create({
      userId: "usr_test",
      role: "user"
    });

    const rotated = await store.rotateByRefreshToken(created.refreshToken);

    expect(rotated).toBeDefined();
    expect(rotated?.accessToken).not.toBe(created.accessToken);
    expect(rotated?.refreshToken).not.toBe(created.refreshToken);
  });
});
