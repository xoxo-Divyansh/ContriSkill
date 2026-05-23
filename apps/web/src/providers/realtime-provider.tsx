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
import { logClientDiagnostic } from "../lib/observability/client-diagnostics";
import { createRealtimeClient, type RealtimeClient } from "../lib/realtime/client";

import { useSession } from "./session-provider";

export type RealtimeUiEvent = {
  eventName: string;
  topicHint?: string;
  payload: unknown;
};

type RealtimeContextValue = {
  state: RealtimeConnectionState;
  connect: () => void;
  disconnect: () => void;
  subscribe: (subscription: RealtimeSubscription) => void;
  unsubscribe: (subscription: RealtimeSubscription) => void;
  subscribeTracked: (subscription: RealtimeSubscription) => () => void;
  addEventListener: (listener: (event: RealtimeUiEvent) => void) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { session, isAuthenticated, isReady } = useSession();
  const [state, setState] = useState<RealtimeConnectionState>("disconnected");
  const clientRef = useRef<RealtimeClient | undefined>(undefined);
  const subscriptionRef = useRef<RealtimeSubscription[]>([]);
  const listenersRef = useRef<Set<(event: RealtimeUiEvent) => void>>(new Set());
  const correlationRef = useRef<string>(`rt_${Math.random().toString(16).slice(2)}`);

  useEffect(() => {
    const env = getWebEnv();
    clientRef.current = createRealtimeClient({
      realtimeUrl: env.realtimeUrl,
      getAccessToken: () => session.accessToken,
      getCorrelationId: () => correlationRef.current,
      onStateChange: (nextState) => setState(nextState),
      onError: (message) => {
        logClientDiagnostic("warn", "Realtime client warning.", {
          message,
          correlationId: correlationRef.current
        });
      },
      onEvent: (event) => {
        let topicHint: string | undefined;
        if (event.scope.type === "contribution") {
          topicHint =
            event.scope.id === "list" ? "contribution:list" : `contribution:${event.scope.id}`;
        }

        for (const listener of listenersRef.current.values()) {
          listener({
            eventName: event.eventName,
            payload: event.payload,
            ...(topicHint ? { topicHint } : {})
          });
        }
      }
    });
    for (const subscription of subscriptionRef.current) {
      clientRef.current.subscribe(subscription);
    }

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
    const subscribe = (subscription: RealtimeSubscription) => {
      const exists = subscriptionRef.current.some((item) => {
        return (
          item.scope.type === subscription.scope.type &&
          item.scope.id === subscription.scope.id &&
          item.topic === subscription.topic
        );
      });
      if (!exists) {
        subscriptionRef.current = [...subscriptionRef.current, subscription];
      }
      clientRef.current?.subscribe(subscription);
    };

    const unsubscribe = (subscription: RealtimeSubscription) => {
      subscriptionRef.current = subscriptionRef.current.filter((item) => {
        return !(
          item.scope.type === subscription.scope.type &&
          item.scope.id === subscription.scope.id &&
          item.topic === subscription.topic
        );
      });
      clientRef.current?.unsubscribe(subscription);
    };

    return {
      state,
      connect: () => clientRef.current?.connect(),
      disconnect: () => clientRef.current?.disconnect(),
      subscribe,
      unsubscribe,
      subscribeTracked: (subscription) => {
        subscribe(subscription);
        return () => {
          unsubscribe(subscription);
        };
      },
      addEventListener: (listener) => {
        listenersRef.current.add(listener);
        return () => {
          listenersRef.current.delete(listener);
        };
      }
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

export const useRealtimeSubscription = (subscription: RealtimeSubscription | undefined): void => {
  const realtime = useRealtime();

  useEffect(() => {
    if (!subscription) {
      return;
    }
    return realtime.subscribeTracked(subscription);
  }, [realtime, subscription]);
};

export const useRealtimeEvent = (handler: ((event: RealtimeUiEvent) => void) | undefined): void => {
  const realtime = useRealtime();

  useEffect(() => {
    if (!handler) {
      return;
    }
    return realtime.addEventListener(handler);
  }, [handler, realtime]);
};
