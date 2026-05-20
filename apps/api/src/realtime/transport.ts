import type { IncomingMessage } from "node:http";

import type { RealtimeTransportIncomingEnvelope, RealtimeTransportSendEnvelope } from "./types";

export type RealtimeClientHandle = {
  id: string;
  close: (code?: number, reason?: string) => void;
  send: (event: RealtimeTransportSendEnvelope) => void;
  isAlive: () => boolean;
  markAlive: () => void;
};

export type RealtimeUpgradeRequest = {
  request: IncomingMessage;
  accept: (clientId: string) => RealtimeClientHandle;
  reject: (statusCode: number, message: string) => void;
};

export type RealtimeTransportLifecycle = {
  onUpgrade: (handler: (event: RealtimeUpgradeRequest) => void) => void;
  onMessage: (
    handler: (client: RealtimeClientHandle, event: RealtimeTransportIncomingEnvelope) => void
  ) => void;
  onClose: (handler: (client: RealtimeClientHandle, code: number, reason: string) => void) => void;
  onError: (handler: (client: RealtimeClientHandle | undefined, error: Error) => void) => void;
  start: () => void;
  stop: () => void;
};
