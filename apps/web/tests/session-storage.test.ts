import { afterEach, describe, expect, it } from "vitest";

import {
  clearSessionSnapshot,
  loadSessionSnapshot,
  loadSessionSnapshotWithDiagnostics,
  saveSessionSnapshot
} from "../src/lib/session/session-storage";
import type { SessionSnapshot } from "../src/types/session";

type LocalStorageStub = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const withWindowStorage = (run: () => void) => {
  const store = new Map<string, string>();
  const storage: LocalStorageStub = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    }
  };

  const previousWindow = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = { localStorage: storage };
  try {
    run();
  } finally {
    if (previousWindow === undefined) {
      delete (globalThis as Record<string, unknown>).window;
    } else {
      (globalThis as Record<string, unknown>).window = previousWindow;
    }
  }
};

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

describe("session storage", () => {
  it("stores and restores session snapshot", () => {
    withWindowStorage(() => {
      const session: SessionSnapshot = {
        actorType: "authenticated",
        role: "user",
        sessionState: "authenticated",
        userId: "usr_1",
        accessToken: "atk_1"
      };

      saveSessionSnapshot(session);
      expect(loadSessionSnapshot()).toEqual(session);
      clearSessionSnapshot();
      expect(loadSessionSnapshot()).toBeUndefined();
    });
  });

  it("reports restore failure for malformed saved session payload", () => {
    withWindowStorage(() => {
      const windowStub = (globalThis as Record<string, unknown>).window as {
        localStorage: LocalStorageStub;
      };
      windowStub.localStorage.setItem("contriskill.session.v1", "{bad-json");

      const result = loadSessionSnapshotWithDiagnostics();
      expect(loadSessionSnapshot()).toBeUndefined();
      expect(result.restoreFailed).toBe(true);
      expect(result.restoreMessage).toBeDefined();
    });
  });
});
