import { realtimeEventNames, realtimeEventVersion } from "@contriskill/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRealtimeClient } from "../src/lib/realtime/client";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static readonly OPEN = 1;

  readonly OPEN = 1;
  readyState = 1;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    this.onclose?.();
  }

  emitOpen(): void {
    this.onopen?.();
  }

  emitMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

describe("realtime client foundation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakeWebSocket.instances = [];
  });

  it("connects with access token and handles heartbeat ack", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    const states: string[] = [];
    const client = createRealtimeClient({
      realtimeUrl: "ws://localhost:4000/api/v1/realtime",
      getAccessToken: () => "token_123",
      onStateChange: (state) => states.push(state)
    });

    client.connect();
    const socket = FakeWebSocket.instances[0];
    expect(socket?.url).toContain("accessToken=token_123");
    socket?.emitOpen();

    socket?.emitMessage({
      eventId: "evt_1",
      eventName: realtimeEventNames.serverHeartbeat,
      version: realtimeEventVersion,
      occurredAt: new Date().toISOString(),
      scope: { type: "actor", id: "usr_1" },
      payload: { heartbeatAt: new Date().toISOString() }
    });

    const sentPayloads =
      socket?.sent.map((payload) => JSON.parse(payload) as { eventName: string }) ?? [];
    expect(
      sentPayloads.some((payload) => payload.eventName === realtimeEventNames.clientHeartbeatAck)
    ).toBe(true);
    expect(states.includes("connected")).toBe(true);
  });

  it("ignores duplicate, stale, and out-of-order events by topic ordering", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    const receivedEventIds: string[] = [];
    const errors: string[] = [];
    const client = createRealtimeClient({
      realtimeUrl: "ws://localhost:4000/api/v1/realtime",
      getAccessToken: () => "token_123",
      onEvent: (event) => {
        receivedEventIds.push(event.eventId);
      },
      onError: (message) => errors.push(message)
    });

    client.connect();
    const socket = FakeWebSocket.instances[0];
    socket?.emitOpen();

    const baseTime = Date.now();
    socket?.emitMessage({
      eventId: "evt_1",
      eventName: realtimeEventNames.contributionUpdated,
      version: realtimeEventVersion,
      occurredAt: new Date(baseTime).toISOString(),
      scope: { type: "contribution", id: "post_1" },
      sequence: 2,
      payload: { postId: "post_1" }
    });
    socket?.emitMessage({
      eventId: "evt_1",
      eventName: realtimeEventNames.contributionUpdated,
      version: realtimeEventVersion,
      occurredAt: new Date(baseTime).toISOString(),
      scope: { type: "contribution", id: "post_1" },
      sequence: 2,
      payload: { postId: "post_1" }
    });
    socket?.emitMessage({
      eventId: "evt_2",
      eventName: realtimeEventNames.contributionUpdated,
      version: realtimeEventVersion,
      occurredAt: new Date(baseTime + 10).toISOString(),
      scope: { type: "contribution", id: "post_1" },
      sequence: 1,
      payload: { postId: "post_1" }
    });
    socket?.emitMessage({
      eventId: "evt_3",
      eventName: realtimeEventNames.contributionUpdated,
      version: realtimeEventVersion,
      occurredAt: new Date(baseTime - 11 * 60 * 1000).toISOString(),
      scope: { type: "contribution", id: "post_1" },
      payload: { postId: "post_1" }
    });

    expect(receivedEventIds).toEqual(["evt_1"]);
    expect(errors.some((message) => message.includes("duplicate event ignored"))).toBe(true);
    expect(errors.some((message) => message.includes("out-of-order event ignored"))).toBe(true);
    expect(errors.some((message) => message.includes("stale event ignored"))).toBe(true);
  });

  it("reuses reconnect token on reconnect for synchronization reconciliation", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {});
    vi.stubGlobal("WebSocket", FakeWebSocket as unknown as typeof WebSocket);
    const client = createRealtimeClient({
      realtimeUrl: "ws://localhost:4000/api/v1/realtime",
      getAccessToken: () => "token_123"
    });

    client.connect();
    const firstSocket = FakeWebSocket.instances[0];
    firstSocket?.emitOpen();
    firstSocket?.emitMessage({
      eventId: "evt_connected",
      eventName: realtimeEventNames.serverConnected,
      version: realtimeEventVersion,
      occurredAt: new Date().toISOString(),
      scope: { type: "actor", id: "usr_1" },
      payload: { reconnectToken: "rct_123", heartbeatIntervalMs: 15000 }
    });
    firstSocket?.close();
    vi.advanceTimersByTime(2500);

    const secondSocket = FakeWebSocket.instances[1];
    expect(secondSocket?.url).toContain("reconnectToken=rct_123");
    vi.useRealTimers();
  });
});
