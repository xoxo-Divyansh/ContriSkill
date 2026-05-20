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
  loadSessionSnapshot,
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

  const setSession = useCallback((nextSession: SessionSnapshot) => {
    setSessionState(nextSession);
    saveSessionSnapshot(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(anonymousSession);
    clearSessionSnapshot();
  }, []);

  useEffect(() => {
    if (isReady) {
      return;
    }

    const storedSession = loadSessionSnapshot();
    if (storedSession) {
      setSessionState(storedSession);
    }
    setIsReady(true);
  }, [isReady]);

  const contextValue = useMemo<SessionContextValue>(() => {
    return {
      session,
      isReady,
      isAuthenticated:
        session.actorType === "authenticated" && session.sessionState === "authenticated",
      setSession,
      clearSession
    };
  }, [session, isReady, setSession, clearSession]);

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider.");
  }

  return context;
};
