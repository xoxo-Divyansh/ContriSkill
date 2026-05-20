import type {
  ClientHeartbeatAckPayload,
  ClientSubscribePayload,
  ClientUnsubscribePayload,
  RealtimeConnectionState,
  RealtimeEventEnvelope,
  RealtimeScope,
  ServerConnectedPayload,
  ServerDisconnectedPayload,
  ServerErrorPayload,
  ServerHeartbeatPayload,
  ServerSubscriptionAcceptedPayload,
  ServerSubscriptionRejectedPayload
} from "@contriskill/contracts";

import type { RequestActor } from "../modules/auth/types";

export type RealtimeConnectionContext = {
  connectionId: string;
  reconnectToken: string;
  connectedAt: string;
  actor: RequestActor;
  state: RealtimeConnectionState;
  lastHeartbeatAt: string;
};

export type RealtimeTransportSendEnvelope =
  | RealtimeEventEnvelope<ServerConnectedPayload>
  | RealtimeEventEnvelope<ServerDisconnectedPayload>
  | RealtimeEventEnvelope<ServerErrorPayload>
  | RealtimeEventEnvelope<ServerSubscriptionAcceptedPayload>
  | RealtimeEventEnvelope<ServerSubscriptionRejectedPayload>
  | RealtimeEventEnvelope<ServerHeartbeatPayload>
  | RealtimeEventEnvelope<unknown>;

export type RealtimeTransportIncomingEnvelope =
  | RealtimeEventEnvelope<ClientSubscribePayload>
  | RealtimeEventEnvelope<ClientUnsubscribePayload>
  | RealtimeEventEnvelope<ClientHeartbeatAckPayload>
  | RealtimeEventEnvelope<unknown>;

export type RealtimeConnectionTarget = {
  connectionId: string;
  actor: RequestActor;
};

export type RealtimeSubscriptionRecord = {
  connectionId: string;
  scope: RealtimeScope;
  topic: string;
  subscribedAt: string;
};
