import {
  realtimeEventNames,
  realtimeEventVersion,
  type RealtimeScope
} from "@contriskill/contracts";
import { describe, expect, it, vi } from "vitest";

import { createRealtimeRuntime } from "../src/realtime/runtime";
import type {
  RealtimeClientHandle,
  RealtimeTransportLifecycle,
  RealtimeUpgradeRequest
} from "../src/realtime/transport";
import type {
  RealtimeTransportIncomingEnvelope,
  RealtimeTransportSendEnvelope
} from "../src/realtime/types";

class FakeClient implements RealtimeClientHandle {
  id: string;
  sent: RealtimeTransportSendEnvelope[] = [];
  closed = false;

  constructor(id: string) {
    this.id = id;
  }

  close(): void {
    this.closed = true;
  }

  send(event: RealtimeTransportSendEnvelope): void {
    this.sent.push(event);
  }

  isAlive(): boolean {
    return true;
  }

  markAlive(): void {}
}

class FakeTransport implements RealtimeTransportLifecycle {
  private upgradeHandler: ((event: RealtimeUpgradeRequest) => void) | undefined;
  private messageHandler:
    | ((client: RealtimeClientHandle, event: RealtimeTransportIncomingEnvelope) => void)
    | undefined;
  private closeHandler:
    | ((client: RealtimeClientHandle, code: number, reason: string) => void)
    | undefined;
  private errorHandler:
    | ((client: RealtimeClientHandle | undefined, error: Error) => void)
    | undefined;

  latestClient: FakeClient | undefined;

  onUpgrade(handler: (event: RealtimeUpgradeRequest) => void): void {
    this.upgradeHandler = handler;
  }
  onMessage(
    handler: (client: RealtimeClientHandle, event: RealtimeTransportIncomingEnvelope) => void
  ): void {
    this.messageHandler = handler;
  }
  onClose(handler: (client: RealtimeClientHandle, code: number, reason: string) => void): void {
    this.closeHandler = handler;
  }
  onError(handler: (client: RealtimeClientHandle | undefined, error: Error) => void): void {
    this.errorHandler = handler;
  }

  start(): void {}
  stop(): void {}

  async emitUpgrade(url: string): Promise<void> {
    await this.upgradeHandler?.({
      request: {
        url
      } as never,
      accept: (clientId) => {
        const client = new FakeClient(clientId);
        this.latestClient = client;
        return client;
      },
      reject: () => {}
    });
  }

  async emitUpgradeWithReject(
    url: string,
    reject: (statusCode: number, message: string) => void
  ): Promise<void> {
    await this.upgradeHandler?.({
      request: {
        url
      } as never,
      accept: (clientId) => {
        const client = new FakeClient(clientId);
        this.latestClient = client;
        return client;
      },
      reject
    });
  }

  emitMessage(event: RealtimeTransportIncomingEnvelope): void {
    if (!this.latestClient) {
      return;
    }
    this.messageHandler?.(this.latestClient, event);
  }

  emitClose(code = 1000, reason = "closed"): void {
    if (!this.latestClient) {
      return;
    }
    this.closeHandler?.(this.latestClient, code, reason);
  }
}

describe("realtime runtime foundation", () => {
  it("authenticates connection and supports subscription primitives", async () => {
    const transport = new FakeTransport();
    const runtime = createRealtimeRuntime({
      transport,
      sessionResolver: {
        resolveActorByAccessToken: async (token) => {
          if (!token) {
            return undefined;
          }
          return {
            actorType: "authenticated",
            role: "user",
            sessionState: "authenticated",
            userId: "usr_42"
          };
        }
      }
    });

    runtime.start();
    await transport.emitUpgrade("/api/v1/realtime?accessToken=tok_123");

    const connectedEvent = transport.latestClient?.sent[0];
    expect(connectedEvent?.eventName).toBe(realtimeEventNames.serverConnected);
    expect(connectedEvent?.version).toBe(realtimeEventVersion);

    const scope: RealtimeScope = { type: "actor", id: "usr_42" };
    transport.emitMessage({
      eventId: "evt_1",
      eventName: realtimeEventNames.clientSubscribe,
      version: realtimeEventVersion,
      occurredAt: new Date().toISOString(),
      scope,
      payload: {
        subscription: {
          scope: { type: "contribution", id: "post_1" },
          topic: "contribution:post_1"
        }
      }
    });

    const accepted = transport.latestClient?.sent.find((event) => {
      return event.eventName === realtimeEventNames.serverSubscriptionAccepted;
    });
    expect(accepted).toBeDefined();
    const snapshot = transport.latestClient?.sent.find((event) => {
      return event.eventName === realtimeEventNames.contributionPresenceSnapshot;
    });
    expect(snapshot).toBeDefined();

    const reconnectToken = (connectedEvent?.payload as { reconnectToken: string }).reconnectToken;
    transport.emitClose();
    expect(runtime.registry.getAllConnections()).toHaveLength(0);

    await transport.emitUpgrade(
      `/api/v1/realtime?accessToken=tok_123&reconnectToken=${encodeURIComponent(reconnectToken)}`
    );
    const restoredAccepted = transport.latestClient?.sent.find((event) => {
      return event.eventName === realtimeEventNames.serverSubscriptionAccepted;
    });
    expect(restoredAccepted).toBeDefined();
    runtime.stop();
  });

  it("rejects unauthenticated upgrades", async () => {
    const transport = new FakeTransport();
    const rejectSpy = vi.fn();
    const runtime = createRealtimeRuntime({
      transport,
      sessionResolver: {
        resolveActorByAccessToken: async () => undefined
      }
    });
    runtime.start();

    await transport.emitUpgradeWithReject("/api/v1/realtime", rejectSpy);

    expect(rejectSpy).toHaveBeenCalledWith(401, "Unauthorized websocket connection");
    runtime.stop();
  });
});
