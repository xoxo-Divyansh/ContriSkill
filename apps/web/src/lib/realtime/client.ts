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
  ServerErrorPayload,
  ServerHeartbeatPayload
} from "@contriskill/contracts";
import { realtimeEventNames, realtimeEventVersion } from "@contriskill/contracts";

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
  onStateChange?: (state: RealtimeConnectionState) => void;
  onError?: (message: string) => void;
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
    return url.toString();
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
    if (typeof WebSocket === "undefined") {
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
      const parsed = JSON.parse(messageEvent.data) as RealtimeEventEnvelope<unknown>;
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
      if (parsed.eventName === realtimeEventNames.serverConnected) {
        void (parsed.payload as ServerConnectedPayload);
        return;
      }
      if (parsed.eventName === realtimeEventNames.serverError) {
        const payload = parsed.payload as ServerErrorPayload;
        options.onError?.(payload.message);
      }
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
