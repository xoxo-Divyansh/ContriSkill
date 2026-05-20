"use client";

import type { RealtimeConnectionState, RealtimeSubscription } from "@contriskill/contracts";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import { getWebEnv } from "../config/env";
import { createRealtimeClient, type RealtimeClient } from "../lib/realtime/client";

import { useSession } from "./session-provider";

type RealtimeContextValue = {
  state: RealtimeConnectionState;
  connect: () => void;
  disconnect: () => void;
  subscribe: (subscription: RealtimeSubscription) => void;
  unsubscribe: (subscription: RealtimeSubscription) => void;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAuthenticated, isReady } = useSession();
  const [state, setState] = useState<RealtimeConnectionState>("disconnected");
  const clientRef = useRef<RealtimeClient | undefined>(undefined);

  useEffect(() => {
    const env = getWebEnv();
    clientRef.current = createRealtimeClient({
      realtimeUrl: env.realtimeUrl,
      getAccessToken: () => session.accessToken,
      onStateChange: (nextState) => setState(nextState)
    });

    return () => {
      clientRef.current?.disconnect();
      clientRef.current = undefined;
    };
  }, [session.accessToken]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const client = clientRef.current;
    if (!client) {
      return;
    }

    if (isAuthenticated) {
      client.connect();
      return;
    }

    client.disconnect();
  }, [isAuthenticated, isReady]);

  const value = useMemo<RealtimeContextValue>(() => {
    return {
      state,
      connect: () => clientRef.current?.connect(),
      disconnect: () => clientRef.current?.disconnect(),
      subscribe: (subscription) => clientRef.current?.subscribe(subscription),
      unsubscribe: (subscription) => clientRef.current?.unsubscribe(subscription)
    };
  }, [state]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = (): RealtimeContextValue => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within RealtimeProvider.");
  }
  return context;
};
