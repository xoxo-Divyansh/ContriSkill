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
  clientHeartbeatAck: "system.heartbeat.pong.v1",
  contributionCreated: "contribution.post.created.v1",
  contributionUpdated: "contribution.post.updated.v1",
  contributionStateChanged: "contribution.post.state_changed.v1",
  contributionPresenceSnapshot: "contribution.presence.snapshot.v1",
  contributionPresenceJoined: "contribution.presence.joined.v1",
  contributionPresenceLeft: "contribution.presence.left.v1"
} as const;

export const realtimeServerEventNames = [
  realtimeEventNames.serverConnected,
  realtimeEventNames.serverDisconnected,
  realtimeEventNames.serverError,
  realtimeEventNames.serverSubscriptionAccepted,
  realtimeEventNames.serverSubscriptionRejected,
  realtimeEventNames.serverHeartbeat,
  realtimeEventNames.contributionCreated,
  realtimeEventNames.contributionUpdated,
  realtimeEventNames.contributionStateChanged,
  realtimeEventNames.contributionPresenceSnapshot,
  realtimeEventNames.contributionPresenceJoined,
  realtimeEventNames.contributionPresenceLeft
] as const;

export const realtimeClientEventNames = [
  realtimeEventNames.clientSubscribe,
  realtimeEventNames.clientUnsubscribe,
  realtimeEventNames.clientHeartbeatAck
] as const;

export const realtimeSubscriptionTopics = ["system.actor", "contribution:list"] as const;

export type RealtimeSubscriptionTopic =
  | (typeof realtimeSubscriptionTopics)[number]
  | `contribution:${string}`;

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
  topic: RealtimeSubscriptionTopic;
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

export type ContributionRealtimePayload = {
  postId: string;
  state?: string;
};

export type ContributionPresenceSnapshotPayload = {
  postId: string;
  activeUserIds: string[];
};

export type ContributionPresenceDeltaPayload = {
  postId: string;
  userId: string;
  activeUserIds: string[];
};
