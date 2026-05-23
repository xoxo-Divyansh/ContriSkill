import type {
  RealtimeConnectionState,
  RealtimeEventEnvelope,
  RealtimeScope,
  RealtimeSubscription
} from "@contriskill/contracts";

import type { RequestActor } from "../modules/auth/types";

export type RealtimeConnectionContext = {
  connectionId: string;
  reconnectToken: string;
  correlationId?: string;
  connectedAt: string;
  actor: RequestActor;
  state: RealtimeConnectionState;
  lastHeartbeatAt: string;
};

export type RealtimeTransportSendEnvelope = RealtimeEventEnvelope<unknown>;

export type RealtimeTransportIncomingEnvelope = RealtimeEventEnvelope<unknown>;

export type RealtimeConnectionTarget = {
  connectionId: string;
  actor: RequestActor;
};

export type RealtimeSubscriptionRecord = {
  connectionId: string;
  scope: RealtimeScope;
  topic: RealtimeSubscription["topic"];
  subscribedAt: string;
};
