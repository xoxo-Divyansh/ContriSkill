import type { SessionSnapshot } from "../../types/session";

const sessionStorageKey = "contriskill.session.v1";

const isBrowser = (): boolean => {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
};

const isSessionSnapshot = (value: unknown): value is SessionSnapshot => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SessionSnapshot>;
  return (
    (candidate.actorType === "anonymous" || candidate.actorType === "authenticated") &&
    typeof candidate.role === "string" &&
    typeof candidate.sessionState === "string"
  );
};

export const loadSessionSnapshotWithDiagnostics = (): {
  snapshot?: SessionSnapshot;
  restoreFailed: boolean;
  restoreMessage?: string;
} => {
  if (!isBrowser()) {
    return { restoreFailed: false };
  }

  const raw = window.localStorage.getItem(sessionStorageKey);
  if (!raw) {
    return { restoreFailed: false };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isSessionSnapshot(parsed)) {
      return { snapshot: parsed, restoreFailed: false };
    }

    return {
      restoreFailed: true,
      restoreMessage: "Saved session data was invalid and could not be restored."
    };
  } catch {
    return {
      restoreFailed: true,
      restoreMessage: "Saved session data could not be read."
    };
  }
};

export const loadSessionSnapshot = (): SessionSnapshot | undefined => {
  const result = loadSessionSnapshotWithDiagnostics();
  return result.snapshot;
};

export const saveSessionSnapshot = (session: SessionSnapshot): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
};

export const clearSessionSnapshot = (): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(sessionStorageKey);
};
