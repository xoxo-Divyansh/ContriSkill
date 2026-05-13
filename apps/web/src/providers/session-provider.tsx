"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

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

  const setSession = useCallback((nextSession: SessionSnapshot) => {
    setSessionState(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(anonymousSession);
  }, []);

  const contextValue = useMemo<SessionContextValue>(() => {
    return {
      session,
      isAuthenticated:
        session.actorType === "authenticated" && session.sessionState === "authenticated",
      setSession,
      clearSession
    };
  }, [session, setSession, clearSession]);

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider.");
  }

  return context;
};
