import type {
  ClientHeartbeatAckPayload,
  ClientSubscribePayload,
  ClientUnsubscribePayload,
  RealtimeConnectionState,
  RealtimeEventEnvelope,
  RealtimeEventName,
  RealtimeScope,
  RealtimeSubscription,
  ServerConnectedPayload,
  ServerDisconnectedPayload,
  ServerErrorPayload,
  ServerHeartbeatPayload
} from "@contriskill/contracts";
import {
  realtimeEventNames,
  realtimeEventVersion,
  realtimeServerEventNames
} from "@contriskill/contracts";

import { createRealtimeOrderingState, shouldApplyRealtimeEvent } from "./event-ordering";

const reconnectDelayMs = 2000;
const createEventId = (): string => {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `rte_${Math.random().toString(16).slice(2)}`;
};

const createEnvelope = <TPayload>(
  eventName: RealtimeEventName,
  scope: RealtimeScope,
  payload: TPayload
): RealtimeEventEnvelope<TPayload> => {
  return {
    eventId: createEventId(),
    eventName,
    version: realtimeEventVersion,
    occurredAt: new Date().toISOString(),
    scope,
    payload
  };
};

type RealtimeClientOptions = {
  realtimeUrl: string;
  getAccessToken: () => string | undefined;
  getCorrelationId?: () => string | undefined;
  onStateChange?: (state: RealtimeConnectionState) => void;
  onError?: (message: string) => void;
  onEvent?: (event: RealtimeEventEnvelope<unknown>) => void;
};

export type RealtimeClient = {
  connect: () => void;
  disconnect: () => void;
  subscribe: (subscription: RealtimeSubscription) => void;
  unsubscribe: (subscription: RealtimeSubscription) => void;
  getState: () => RealtimeConnectionState;
};

export const createRealtimeClient = (options: RealtimeClientOptions): RealtimeClient => {
  let socket: WebSocket | undefined;
  let state: RealtimeConnectionState = "disconnected";
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let subscriptions: RealtimeSubscription[] = [];
  let manuallyClosed = false;
  let reconnectToken: string | undefined;
  const seenEventIds = new Set<string>();
  const orderingState = createRealtimeOrderingState();

  const setState = (nextState: RealtimeConnectionState): void => {
    state = nextState;
    options.onStateChange?.(state);
  };

  const send = (event: RealtimeEventEnvelope<unknown>): void => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(event));
  };

  const getConnectionUrl = (): string => {
    const token = options.getAccessToken();
    const url = new URL(options.realtimeUrl);
    if (token) {
      url.searchParams.set("accessToken", token);
    }
    if (reconnectToken) {
      url.searchParams.set("reconnectToken", reconnectToken);
    }
    const correlationId = options.getCorrelationId?.();
    if (correlationId) {
      url.searchParams.set("cid", correlationId);
    }
    return url.toString();
  };

  const isValidEnvelope = (value: unknown): value is RealtimeEventEnvelope<unknown> => {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const event = value as Partial<RealtimeEventEnvelope<unknown>>;
    if (typeof event.eventId !== "string" || typeof event.eventName !== "string") {
      return false;
    }
    if (!realtimeServerEventNames.includes(event.eventName as never)) {
      return false;
    }
    return event.version === realtimeEventVersion;
  };

  const subscribeAll = (): void => {
    for (const subscription of subscriptions) {
      send(
        createEnvelope<ClientSubscribePayload>(
          realtimeEventNames.clientSubscribe,
          subscription.scope,
          { subscription }
        )
      );
    }
  };

  const connect = (): void => {
    if (typeof window === "undefined") {
      return;
    }
    if (state === "connecting" || state === "connected") {
      return;
    }
    const token = options.getAccessToken();
    if (!token) {
      setState("disconnected");
      return;
    }

    manuallyClosed = false;
    setState(state === "reconnecting" ? "reconnecting" : "connecting");
    socket = new WebSocket(getConnectionUrl());

    socket.onopen = () => {
      setState("connected");
      subscribeAll();
    };

    socket.onmessage = (messageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(messageEvent.data);
      } catch {
        options.onError?.("Realtime payload parse error.");
        return;
      }
      if (!isValidEnvelope(parsed)) {
        options.onError?.("Realtime envelope validation failed.");
        return;
      }

      if (parsed.eventName === realtimeEventNames.serverHeartbeat) {
        const payload = parsed.payload as ServerHeartbeatPayload;
        send(
          createEnvelope<ClientHeartbeatAckPayload>(
            realtimeEventNames.clientHeartbeatAck,
            parsed.scope,
            { heartbeatAt: payload.heartbeatAt }
          )
        );
        return;
      }
      if (seenEventIds.has(parsed.eventId)) {
        options.onError?.(`Realtime duplicate event ignored: ${parsed.eventId}.`);
        return;
      }
      seenEventIds.add(parsed.eventId);
      if (parsed.eventName === realtimeEventNames.serverConnected) {
        const payload = parsed.payload as ServerConnectedPayload;
        reconnectToken = payload.reconnectToken;
        return;
      }
      if (parsed.eventName === realtimeEventNames.serverDisconnected) {
        const payload = parsed.payload as ServerDisconnectedPayload;
        options.onError?.(`Realtime disconnected: ${payload.reason}`);
        return;
      }
      if (parsed.eventName === realtimeEventNames.serverError) {
        const payload = parsed.payload as ServerErrorPayload;
        options.onError?.(payload.message);
      }
      const orderingDecision = shouldApplyRealtimeEvent(parsed, orderingState);
      if (!orderingDecision.apply) {
        if (orderingDecision.reason === "out_of_order_sequence") {
          options.onError?.("Realtime out-of-order event ignored.");
        } else if (orderingDecision.reason === "stale_event") {
          options.onError?.("Realtime stale event ignored.");
        } else {
          options.onError?.("Realtime stale timestamp event ignored.");
        }
        return;
      }
      options.onEvent?.(parsed);
    };

    socket.onerror = () => {
      options.onError?.("Realtime connection error.");
    };

    socket.onclose = () => {
      socket = undefined;
      if (manuallyClosed) {
        setState("disconnected");
        return;
      }
      setState("reconnecting");
      reconnectTimer = setTimeout(() => {
        connect();
      }, reconnectDelayMs);
    };
  };

  return {
    connect,
    disconnect: () => {
      manuallyClosed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
      socket?.close(1000, "client_disconnect");
      socket = undefined;
      setState("disconnected");
      reconnectToken = undefined;
      seenEventIds.clear();
      orderingState.lastOccurredAtByTopic.clear();
      orderingState.lastSequenceByTopic.clear();
    },
    subscribe: (subscription) => {
      const exists = subscriptions.some((entry) => {
        return entry.topic === subscription.topic && entry.scope.id === subscription.scope.id;
      });
      if (!exists) {
        subscriptions = [...subscriptions, subscription];
      }
      if (state === "connected") {
        send(
          createEnvelope<ClientSubscribePayload>(
            realtimeEventNames.clientSubscribe,
            subscription.scope,
            { subscription }
          )
        );
      }
    },
    unsubscribe: (subscription) => {
      subscriptions = subscriptions.filter((entry) => {
        return !(entry.topic === subscription.topic && entry.scope.id === subscription.scope.id);
      });
      if (state === "connected") {
        send(
          createEnvelope<ClientUnsubscribePayload>(
            realtimeEventNames.clientUnsubscribe,
            subscription.scope,
            { subscription }
          )
        );
      }
    },
    getState: () => state
  };
};
