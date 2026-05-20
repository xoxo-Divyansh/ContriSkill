import { randomUUID } from "node:crypto";
import type { Server as HttpServer, IncomingMessage } from "node:http";

import type { RawData, WebSocket } from "ws";
import { WebSocketServer } from "ws";

import { log } from "../observability/logger";

import type {
  RealtimeClientHandle,
  RealtimeTransportLifecycle,
  RealtimeUpgradeRequest
} from "./transport";
import type { RealtimeTransportIncomingEnvelope, RealtimeTransportSendEnvelope } from "./types";

type ListenerSet = {
  upgrade?: (event: RealtimeUpgradeRequest) => void;
  message?: (client: RealtimeClientHandle, event: RealtimeTransportIncomingEnvelope) => void;
  close?: (client: RealtimeClientHandle, code: number, reason: string) => void;
  error?: (client: RealtimeClientHandle | undefined, error: Error) => void;
};

const decodePayload = (raw: RawData): RealtimeTransportIncomingEnvelope => {
  const text = raw.toString();
  return JSON.parse(text) as RealtimeTransportIncomingEnvelope;
};

const encodePayload = (event: RealtimeTransportSendEnvelope): string => {
  return JSON.stringify(event);
};

const getCloseReason = (reason: Buffer): string => {
  if (reason.length === 0) {
    return "closed";
  }
  return reason.toString();
};

export const createWsTransport = (server: HttpServer, path: string): RealtimeTransportLifecycle => {
  const wsServer = new WebSocketServer({ noServer: true });
  const listeners: ListenerSet = {};

  const connectionMap = new WeakMap<WebSocket, RealtimeClientHandle>();

  const createClientHandle = (socket: WebSocket, id: string): RealtimeClientHandle => {
    let alive = true;
    const handle: RealtimeClientHandle = {
      id,
      close: (code = 1000, reason = "closed") => socket.close(code, reason),
      send: (event) => {
        if (socket.readyState !== socket.OPEN) {
          return;
        }
        socket.send(encodePayload(event));
      },
      isAlive: () => alive,
      markAlive: () => {
        alive = true;
      }
    };

    socket.on("pong", () => {
      handle.markAlive();
    });

    socket.on("close", (code, reason) => {
      listeners.close?.(handle, code, getCloseReason(reason));
    });

    socket.on("message", (raw) => {
      try {
        const decoded = decodePayload(raw);
        listeners.message?.(handle, decoded);
      } catch (error) {
        const resolvedError =
          error instanceof Error ? error : new Error("Failed to parse realtime payload.");
        listeners.error?.(handle, resolvedError);
      }
    });

    socket.on("error", (error) => {
      listeners.error?.(handle, error);
    });

    connectionMap.set(socket, handle);
    return handle;
  };

  const onServerUpgrade = (
    request: IncomingMessage,
    socket: import("node:net").Socket,
    head: Buffer
  ) => {
    const requestPath = request.url ? new URL(request.url, "http://localhost").pathname : "/";
    if (requestPath !== path) {
      return;
    }

    const event: RealtimeUpgradeRequest = {
      request,
      accept: (clientId) => {
        let acceptedHandle: RealtimeClientHandle | undefined;
        wsServer.handleUpgrade(request, socket, head, (client) => {
          acceptedHandle = createClientHandle(client, clientId);
          wsServer.emit("connection", client, request);
        });

        if (!acceptedHandle) {
          throw new Error("Failed to accept websocket upgrade.");
        }
        return acceptedHandle;
      },
      reject: (statusCode, message) => {
        socket.write(
          `HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n${message}`
        );
        socket.destroy();
      }
    };

    listeners.upgrade?.(event);
  };

  return {
    onUpgrade: (handler) => {
      listeners.upgrade = handler;
    },
    onMessage: (handler) => {
      listeners.message = handler;
    },
    onClose: (handler) => {
      listeners.close = handler;
    },
    onError: (handler) => {
      listeners.error = handler;
    },
    start: () => {
      server.on("upgrade", onServerUpgrade);
      log("info", "Realtime websocket transport started.", { path });
    },
    stop: () => {
      server.off("upgrade", onServerUpgrade);
      wsServer.clients.forEach((client) => {
        try {
          client.close(1001, "server_shutdown");
        } catch {
          // no-op
        }
      });
      log("info", "Realtime websocket transport stopped.", { path, stopId: randomUUID() });
    }
  };
};
