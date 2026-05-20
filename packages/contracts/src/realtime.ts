export const realtimeEventVersion = 1 as const;

export const realtimeEventNames = {
  serverConnected: "system.connection.connected.v1",
  serverDisconnected: "system.connection.disconnected.v1",
  serverError: "system.connection.error.v1",
  clientSubscribe: "system.subscription.subscribe.v1",
  clientUnsubscribe: "system.subscription.unsubscribe.v1",
  serverSubscriptionAccepted: "system.subscription.accepted.v1",
  serverSubscriptionRejected: "system.subscription.rejected.v1",
  serverHeartbeat: "system.heartbeat.ping.v1",
  clientHeartbeatAck: "system.heartbeat.pong.v1"
} as const;

export type RealtimeEventName = (typeof realtimeEventNames)[keyof typeof realtimeEventNames];

export type RealtimeScopeType = "actor" | "contribution";

export type RealtimeScope = {
  type: RealtimeScopeType;
  id: string;
};

export type RealtimeEventEnvelope<TPayload> = {
  eventId: string;
  eventName: RealtimeEventName;
  version: typeof realtimeEventVersion;
  occurredAt: string;
  scope: RealtimeScope;
  connectionId?: string;
  sequence?: number;
  cursor?: string;
  payload: TPayload;
};

export type RealtimeSubscription = {
  scope: RealtimeScope;
  topic: string;
};

export type RealtimeConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

export type ClientSubscribePayload = {
  subscription: RealtimeSubscription;
};

export type ClientUnsubscribePayload = {
  subscription: RealtimeSubscription;
};

export type ServerConnectedPayload = {
  reconnectToken: string;
  heartbeatIntervalMs: number;
};

export type ServerDisconnectedPayload = {
  reason: string;
};

export type ServerErrorPayload = {
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "VALIDATION_ERROR" | "RUNTIME_ERROR";
  message: string;
};

export type ServerSubscriptionAcceptedPayload = {
  subscription: RealtimeSubscription;
};

export type ServerSubscriptionRejectedPayload = {
  subscription: RealtimeSubscription;
  reason: string;
};

export type ServerHeartbeatPayload = {
  heartbeatAt: string;
};

export type ClientHeartbeatAckPayload = {
  heartbeatAt: string;
};
