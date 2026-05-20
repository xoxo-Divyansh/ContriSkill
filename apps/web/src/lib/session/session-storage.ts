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

export const loadSessionSnapshot = (): SessionSnapshot | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  const raw = window.localStorage.getItem(sessionStorageKey);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isSessionSnapshot(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
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
