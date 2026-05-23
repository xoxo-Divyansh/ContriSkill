"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  clearSessionSnapshot,
  loadSessionSnapshotWithDiagnostics,
  saveSessionSnapshot
} from "../lib/session/session-storage";
import { anonymousSession, type SessionContextValue, type SessionSnapshot } from "../types/session";

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export type SessionProviderProps = {
  children: ReactNode;
  initialSession?: SessionSnapshot;
};

export const SessionProvider = ({
  children,
  initialSession = anonymousSession
}: SessionProviderProps) => {
  const [session, setSessionState] = useState<SessionSnapshot>(initialSession);
  const [isReady, setIsReady] = useState<boolean>(initialSession !== anonymousSession);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | undefined>();
  const [bootstrapFailed, setBootstrapFailed] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | undefined>();

  const setSession = useCallback((nextSession: SessionSnapshot) => {
    setSessionState(nextSession);
    setRestoreFailed(false);
    setRestoreMessage(undefined);
    setBootstrapFailed(false);
    setBootstrapMessage(undefined);
    saveSessionSnapshot(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(anonymousSession);
    setRestoreFailed(false);
    setRestoreMessage(undefined);
    setBootstrapFailed(false);
    setBootstrapMessage(undefined);
    clearSessionSnapshot();
  }, []);

  const setBootstrapIssue = useCallback((message: string) => {
    setBootstrapFailed(true);
    setBootstrapMessage(message);
  }, []);

  const clearBootstrapIssue = useCallback(() => {
    setBootstrapFailed(false);
    setBootstrapMessage(undefined);
  }, []);

  useEffect(() => {
    if (isReady) {
      return;
    }

    const restored = loadSessionSnapshotWithDiagnostics();
    if (restored.snapshot) {
      setSessionState(restored.snapshot);
    }
    setRestoreFailed(restored.restoreFailed);
    setRestoreMessage(restored.restoreMessage);
    setIsReady(true);
  }, [isReady]);

  const contextValue = useMemo<SessionContextValue>(() => {
    return {
      session,
      isReady,
      restoreFailed,
      restoreMessage,
      bootstrapFailed,
      bootstrapMessage,
      setBootstrapIssue,
      clearBootstrapIssue,
      isAuthenticated:
        session.actorType === "authenticated" && session.sessionState === "authenticated",
      setSession,
      clearSession
    };
  }, [
    session,
    isReady,
    restoreFailed,
    restoreMessage,
    bootstrapFailed,
    bootstrapMessage,
    setBootstrapIssue,
    clearBootstrapIssue,
    setSession,
    clearSession
  ]);

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider.");
  }

  return context;
};
