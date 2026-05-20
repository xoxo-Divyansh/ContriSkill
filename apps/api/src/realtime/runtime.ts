import { randomUUID } from "node:crypto";

import {
  type ContributionPresenceDeltaPayload,
  type ContributionPresenceSnapshotPayload,
  realtimeClientEventNames,
  realtimeEventNames,
  realtimeEventVersion,
  type ClientHeartbeatAckPayload,
  type ClientSubscribePayload,
  type ClientUnsubscribePayload,
  type RealtimeEventEnvelope,
  type RealtimeScope,
  type RealtimeSubscription,
  type RealtimeSubscriptionTopic
} from "@contriskill/contracts";

import type { SessionResolver } from "../modules/auth/session";
import { log } from "../observability/logger";

import type { RealtimeBroadcaster } from "./broadcaster";
import { RealtimeConnectionRegistry } from "./connection-registry";
import { RealtimeEventSequencer } from "./event-sequencer";
import { RealtimePresenceRegistry } from "./presence-registry";
import { authorizeSubscription } from "./subscription-policy";
import { contributionListTopic, extractContributionRoomId } from "./topic-helpers";
import type { RealtimeClientHandle, RealtimeTransportLifecycle } from "./transport";
import type { RealtimeConnectionContext, RealtimeTransportIncomingEnvelope } from "./types";
import { validateIncomingEnvelope } from "./validation";

const realtimePath = "/api/v1/realtime";
const heartbeatIntervalMs = 15000;
const heartbeatStaleThresholdMs = 45000;
const reconnectTokenWindowMs = 60000;
const incomingEventStaleThresholdMs = 5 * 60 * 1000;
const incomingEventFutureThresholdMs = 60 * 1000;

const getSessionToken = (url: URL): string | undefined => {
  const token = url.searchParams.get("accessToken");
  if (!token) {
    return undefined;
  }
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getReconnectToken = (url: URL): string | undefined => {
  const token = url.searchParams.get("reconnectToken");
  if (!token) {
    return undefined;
  }
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const createEvent = <TPayload>(
  eventName: RealtimeEventEnvelope<TPayload>["eventName"],
  scope: RealtimeScope,
  payload: TPayload,
  options: {
    connectionId?: string;
  } = {}
): RealtimeEventEnvelope<TPayload> => {
  return {
    eventId: `rte_${randomUUID()}`,
    eventName,
    version: realtimeEventVersion,
    occurredAt: new Date().toISOString(),
    scope,
    payload,
    ...(options.connectionId ? { connectionId: options.connectionId } : {})
  };
};

type RealtimeRuntimeDependencies = {
  transport: RealtimeTransportLifecycle;
  sessionResolver: SessionResolver;
};

export type RealtimeRuntime = {
  path: string;
  registry: RealtimeConnectionRegistry;
  broadcaster: RealtimeBroadcaster;
  start: () => void;
  stop: () => void;
};

export const createRealtimeRuntime = ({
  transport,
  sessionResolver
}: RealtimeRuntimeDependencies): RealtimeRuntime => {
  const registry = new RealtimeConnectionRegistry();
  const presenceRegistry = new RealtimePresenceRegistry();
  const clients = new Map<string, RealtimeClientHandle>();
  const disconnectedSubscriptionSnapshot = new Map<
    string,
    {
      actorUserId: string;
      expiresAt: number;
      subscriptions: { scope: RealtimeScope; topic: RealtimeSubscription["topic"] }[];
    }
  >();
  const inboundSeenEventIdsByConnection = new Map<string, Set<string>>();
  const lastInboundOccurredAtByConnection = new Map<string, number>();
  const sequencer = new RealtimeEventSequencer();
  let heartbeatTimer: NodeJS.Timeout | undefined;

  const onUnauthorized = (client: RealtimeClientHandle, message: string): void => {
    client.send(
      createEvent(
        realtimeEventNames.serverError,
        { type: "actor", id: "anonymous" },
        { code: "UNAUTHENTICATED", message },
        { connectionId: client.id }
      )
    );
    client.close(4401, "unauthenticated");
  };

  const cleanupDisconnectedSnapshots = (): void => {
    const now = Date.now();
    for (const [token, snapshot] of disconnectedSubscriptionSnapshot.entries()) {
      if (snapshot.expiresAt <= now) {
        disconnectedSubscriptionSnapshot.delete(token);
      }
    }
  };

  const isTopicScopeCompatible = (subscription: RealtimeSubscription): boolean => {
    if (subscription.topic === "system.actor") {
      return subscription.scope.type === "actor";
    }

    if (subscription.topic === contributionListTopic) {
      return subscription.scope.type === "contribution" && subscription.scope.id === "list";
    }

    if (subscription.topic.startsWith("contribution:")) {
      const suffix = subscription.topic.slice("contribution:".length);
      return (
        suffix.length > 0 &&
        suffix !== "list" &&
        subscription.scope.type === "contribution" &&
        subscription.scope.id === suffix
      );
    }

    return false;
  };

  const broadcastPresenceSnapshot = (
    client: RealtimeClientHandle,
    postId: string,
    activeUserIds: string[]
  ): void => {
    client.send(
      createEvent<ContributionPresenceSnapshotPayload>(
        realtimeEventNames.contributionPresenceSnapshot,
        { type: "contribution", id: postId },
        { postId, activeUserIds },
        { connectionId: client.id }
      )
    );
  };

  const broadcastPresenceJoined = (
    postId: string,
    userId: string,
    activeUserIds: string[]
  ): void => {
    broadcast(
      `contribution:${postId}`,
      createEvent<ContributionPresenceDeltaPayload>(
        realtimeEventNames.contributionPresenceJoined,
        { type: "contribution", id: postId },
        { postId, userId, activeUserIds }
      )
    );
  };

  const broadcastPresenceLeft = (postId: string, userId: string, activeUserIds: string[]): void => {
    broadcast(
      `contribution:${postId}`,
      createEvent<ContributionPresenceDeltaPayload>(
        realtimeEventNames.contributionPresenceLeft,
        { type: "contribution", id: postId },
        { postId, userId, activeUserIds }
      )
    );
  };

  const disconnect = (client: RealtimeClientHandle, reason: string): void => {
    const context = registry.get(client.id);
    if (context?.actor.userId) {
      const disconnectedRooms = registry
        .getSubscriptions(client.id)
        .map((entry) => extractContributionRoomId(entry.topic))
        .filter((roomId): roomId is string => Boolean(roomId));
      for (const roomId of disconnectedRooms) {
        const leaveResult = presenceRegistry.leaveRoom(client.id, roomId, context.actor.userId);
        if (leaveResult.left) {
          broadcastPresenceLeft(roomId, context.actor.userId, leaveResult.activeUserIds);
        }
      }
      presenceRegistry.removeConnection(client.id, context.actor.userId);
    }

    if (context?.actor.userId) {
      const subscriptions = registry.getSubscriptions(client.id).map((entry) => {
        return {
          scope: entry.scope,
          topic: entry.topic
        };
      });
      disconnectedSubscriptionSnapshot.set(context.reconnectToken, {
        actorUserId: context.actor.userId,
        expiresAt: Date.now() + reconnectTokenWindowMs,
        subscriptions
      });
    }

    registry.unregister(client.id);
    clients.delete(client.id);
    inboundSeenEventIdsByConnection.delete(client.id);
    lastInboundOccurredAtByConnection.delete(client.id);
    log("info", "Realtime client disconnected.", { connectionId: client.id, reason });
  };

  const handleSubscribe = (client: RealtimeClientHandle, payload: ClientSubscribePayload): void => {
    const context = registry.get(client.id);
    if (!context) {
      onUnauthorized(client, "Connection context missing.");
      return;
    }

    const authorization = authorizeSubscription(context.actor, payload.subscription);
    if (!authorization.allowed) {
      log("warn", "Realtime subscription rejected.", {
        connectionId: client.id,
        actorUserId: context.actor.userId,
        reason: authorization.reason,
        scopeType: payload.subscription.scope.type,
        scopeId: payload.subscription.scope.id,
        topic: payload.subscription.topic
      });
      client.send(
        createEvent(
          realtimeEventNames.serverSubscriptionRejected,
          payload.subscription.scope,
          { subscription: payload.subscription, reason: authorization.reason },
          { connectionId: client.id }
        )
      );
      return;
    }

    if (!isTopicScopeCompatible(payload.subscription)) {
      log("warn", "Realtime subscription rejected due to topic/scope mismatch.", {
        connectionId: client.id,
        actorUserId: context.actor.userId,
        scopeType: payload.subscription.scope.type,
        scopeId: payload.subscription.scope.id,
        topic: payload.subscription.topic
      });
      client.send(
        createEvent(
          realtimeEventNames.serverSubscriptionRejected,
          payload.subscription.scope,
          { subscription: payload.subscription, reason: "topic_scope_mismatch" },
          { connectionId: client.id }
        )
      );
      return;
    }

    const subscription = registry.subscribe(
      client.id,
      payload.subscription.scope,
      payload.subscription.topic
    );

    client.send(
      createEvent(
        realtimeEventNames.serverSubscriptionAccepted,
        subscription.scope,
        { subscription: { scope: subscription.scope, topic: subscription.topic } },
        { connectionId: client.id }
      )
    );

    if (context.actor.userId) {
      const roomId = extractContributionRoomId(subscription.topic);
      if (roomId) {
        const joinResult = presenceRegistry.joinRoom(client.id, roomId, context.actor.userId);
        broadcastPresenceSnapshot(client, roomId, joinResult.activeUserIds);
        if (joinResult.joined) {
          broadcastPresenceJoined(roomId, context.actor.userId, joinResult.activeUserIds);
        }
      }
    }
  };

  const handleUnsubscribe = (
    client: RealtimeClientHandle,
    payload: ClientUnsubscribePayload
  ): void => {
    const unsubscribed = registry.unsubscribe(
      client.id,
      payload.subscription.scope,
      payload.subscription.topic
    );
    if (!unsubscribed) {
      return;
    }

    const context = registry.get(client.id);
    if (context?.actor.userId) {
      const roomId = extractContributionRoomId(payload.subscription.topic);
      if (roomId) {
        const leaveResult = presenceRegistry.leaveRoom(client.id, roomId, context.actor.userId);
        if (leaveResult.left) {
          broadcastPresenceLeft(roomId, context.actor.userId, leaveResult.activeUserIds);
        }
      }
    }

    client.send(
      createEvent(
        realtimeEventNames.serverSubscriptionAccepted,
        payload.subscription.scope,
        { subscription: payload.subscription },
        { connectionId: client.id }
      )
    );
  };

  const handleHeartbeatAck = (
    client: RealtimeClientHandle,
    payload: ClientHeartbeatAckPayload
  ): void => {
    client.markAlive();
    registry.updateHeartbeat(client.id, payload.heartbeatAt);
  };

  const handleMessage = (
    client: RealtimeClientHandle,
    event: RealtimeTransportIncomingEnvelope
  ): void => {
    const validation = validateIncomingEnvelope(event);
    if (!validation.ok) {
      log("warn", "Realtime malformed event rejected.", {
        connectionId: client.id,
        reason: validation.reason
      });
      client.send(
        createEvent(
          realtimeEventNames.serverError,
          { type: "actor", id: "system" },
          {
            code: "VALIDATION_ERROR",
            message: validation.reason
          },
          { connectionId: client.id }
        )
      );
      return;
    }

    const validated = validation.value;
    const now = Date.now();
    const eventTime = Date.parse(validated.occurredAt);
    if (Number.isFinite(eventTime)) {
      if (now - eventTime > incomingEventStaleThresholdMs) {
        log("warn", "Realtime stale incoming event rejected.", {
          connectionId: client.id,
          eventId: validated.eventId,
          eventName: validated.eventName
        });
        return;
      }
      if (eventTime - now > incomingEventFutureThresholdMs) {
        log("warn", "Realtime future-skew incoming event rejected.", {
          connectionId: client.id,
          eventId: validated.eventId,
          eventName: validated.eventName
        });
        return;
      }
      const lastOccurredAt = lastInboundOccurredAtByConnection.get(client.id) ?? 0;
      if (eventTime < lastOccurredAt) {
        log("warn", "Realtime out-of-order incoming event rejected.", {
          connectionId: client.id,
          eventId: validated.eventId,
          eventName: validated.eventName
        });
        return;
      }
      lastInboundOccurredAtByConnection.set(client.id, eventTime);
    }

    const seenByConnection = inboundSeenEventIdsByConnection.get(client.id) ?? new Set<string>();
    if (seenByConnection.has(validated.eventId)) {
      log("debug", "Realtime duplicate incoming event ignored.", {
        connectionId: client.id,
        eventId: validated.eventId
      });
      return;
    }
    seenByConnection.add(validated.eventId);
    inboundSeenEventIdsByConnection.set(client.id, seenByConnection);

    if (!realtimeClientEventNames.includes(validated.eventName as never)) {
      client.send(
        createEvent(
          realtimeEventNames.serverError,
          { type: "actor", id: "system" },
          {
            code: "VALIDATION_ERROR",
            message: `Unsupported event name: ${validated.eventName}`
          },
          { connectionId: client.id }
        )
      );
      return;
    }

    switch (validated.eventName) {
      case realtimeEventNames.clientSubscribe:
        handleSubscribe(client, validated.payload as ClientSubscribePayload);
        return;
      case realtimeEventNames.clientUnsubscribe:
        handleUnsubscribe(client, validated.payload as ClientUnsubscribePayload);
        return;
      case realtimeEventNames.clientHeartbeatAck:
        handleHeartbeatAck(client, validated.payload as ClientHeartbeatAckPayload);
        return;
      default:
        client.send(
          createEvent(
            realtimeEventNames.serverError,
            { type: "actor", id: "system" },
            {
              code: "VALIDATION_ERROR",
              message: `Unsupported event name: ${event.eventName}`
            },
            { connectionId: client.id }
          )
        );
    }
  };

  const sendHeartbeat = (): void => {
    const now = Date.now();
    cleanupDisconnectedSnapshots();
    for (const context of registry.getAllConnections()) {
      const client = clients.get(context.connectionId);
      if (!client) {
        continue;
      }

      const lastHeartbeat = new Date(context.lastHeartbeatAt).getTime();
      if (Number.isFinite(lastHeartbeat) && now - lastHeartbeat > heartbeatStaleThresholdMs) {
        client.send(
          createEvent(
            realtimeEventNames.serverDisconnected,
            { type: "actor", id: context.actor.userId ?? "anonymous" },
            { reason: "heartbeat_timeout" },
            { connectionId: context.connectionId }
          )
        );
        client.close(4001, "heartbeat_timeout");
        disconnect(client, "heartbeat_timeout");
        continue;
      }

      client.send(
        createEvent(
          realtimeEventNames.serverHeartbeat,
          { type: "actor", id: context.actor.userId ?? "anonymous" },
          { heartbeatAt: new Date().toISOString() },
          { connectionId: context.connectionId }
        )
      );
    }
  };

  transport.onUpgrade(async (event) => {
    cleanupDisconnectedSnapshots();
    const requestUrl = new URL(event.request.url ?? "/", "http://localhost");
    const token = getSessionToken(requestUrl);
    const reconnectToken = getReconnectToken(requestUrl);
    const actor = await sessionResolver.resolveActorByAccessToken(token);

    if (!actor || actor.actorType !== "authenticated" || actor.sessionState !== "authenticated") {
      event.reject(401, "Unauthorized websocket connection");
      return;
    }

    const connectionId = `rt_${randomUUID()}`;
    const client = event.accept(connectionId);
    const restoredReconnectToken =
      reconnectToken &&
      disconnectedSubscriptionSnapshot.get(reconnectToken) &&
      disconnectedSubscriptionSnapshot.get(reconnectToken)?.actorUserId === actor.userId &&
      (disconnectedSubscriptionSnapshot.get(reconnectToken)?.expiresAt ?? 0) > Date.now()
        ? reconnectToken
        : undefined;
    const connectionContext: RealtimeConnectionContext = {
      connectionId,
      reconnectToken: restoredReconnectToken ?? `rct_${randomUUID()}`,
      connectedAt: new Date().toISOString(),
      actor,
      state: "connected",
      lastHeartbeatAt: new Date().toISOString()
    };

    clients.set(connectionId, client);
    registry.register(connectionContext);
    inboundSeenEventIdsByConnection.set(connectionId, new Set<string>());

    client.send(
      createEvent(
        realtimeEventNames.serverConnected,
        { type: "actor", id: actor.userId ?? "unknown" },
        {
          reconnectToken: connectionContext.reconnectToken,
          heartbeatIntervalMs
        },
        { connectionId }
      )
    );

    if (restoredReconnectToken) {
      const snapshot = disconnectedSubscriptionSnapshot.get(restoredReconnectToken);
      disconnectedSubscriptionSnapshot.delete(restoredReconnectToken);
      for (const entry of snapshot?.subscriptions ?? []) {
        handleSubscribe(client, {
          subscription: {
            scope: entry.scope,
            topic: entry.topic
          }
        });
      }
      log("info", "Realtime subscriptions restored from reconnect token.", {
        connectionId,
        actorUserId: actor.userId,
        restoredCount: snapshot?.subscriptions.length ?? 0
      });
    }

    log("info", "Realtime client connected.", {
      connectionId,
      actorUserId: actor.userId,
      path: realtimePath
    });
  });

  transport.onMessage((client, event) => {
    handleMessage(client, event);
  });

  transport.onClose((client, code, reason) => {
    disconnect(client, `${code}:${reason}`);
  });

  transport.onError((client, error) => {
    log("error", "Realtime transport error.", {
      connectionId: client?.id,
      message: error.message
    });
    if (client) {
      client.send(
        createEvent(
          realtimeEventNames.serverError,
          { type: "actor", id: "system" },
          { code: "RUNTIME_ERROR", message: "Realtime runtime error." },
          { connectionId: client.id }
        )
      );
    }
  });

  const broadcast = (
    topic: RealtimeSubscriptionTopic,
    envelope: RealtimeEventEnvelope<unknown>
  ): void => {
    const sequence = sequencer.next(topic);
    const dispatchEnvelope: RealtimeEventEnvelope<unknown> = {
      ...envelope,
      sequence,
      cursor: `${topic}:${sequence}`
    };
    const targets = registry.getTargetsByTopic(topic);
    for (const target of targets) {
      const client = clients.get(target.connectionId);
      if (!client) {
        continue;
      }
      try {
        client.send(dispatchEnvelope);
      } catch (error) {
        log("warn", "Realtime broadcast dispatch failed.", {
          connectionId: target.connectionId,
          topic,
          message: error instanceof Error ? error.message : "unknown"
        });
      }
    }
    log("debug", "Realtime broadcast dispatched.", {
      topic,
      targetCount: targets.length,
      eventName: dispatchEnvelope.eventName,
      sequence
    });
  };

  const broadcaster: RealtimeBroadcaster = {
    broadcastContributionCreated: () => {
      return;
    },
    broadcastContributionUpdated: () => {
      return;
    },
    broadcastContributionStateChanged: () => {
      return;
    },
    broadcast
  };

  return {
    path: realtimePath,
    registry,
    broadcaster,
    start: () => {
      transport.start();
      heartbeatTimer = setInterval(sendHeartbeat, heartbeatIntervalMs);
      heartbeatTimer.unref();
      log("info", "Realtime runtime started.", {
        path: realtimePath,
        heartbeatIntervalMs
      });
    },
    stop: () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = undefined;
      }
      transport.stop();
      for (const client of clients.values()) {
        client.close(1001, "server_shutdown");
      }
      clients.clear();
      for (const context of registry.getAllConnections()) {
        if (context.actor.userId) {
          const disconnectedRooms = registry
            .getSubscriptions(context.connectionId)
            .map((entry) => extractContributionRoomId(entry.topic))
            .filter((roomId): roomId is string => Boolean(roomId));
          for (const roomId of disconnectedRooms) {
            const leaveResult = presenceRegistry.leaveRoom(
              context.connectionId,
              roomId,
              context.actor.userId
            );
            if (leaveResult.left) {
              broadcastPresenceLeft(roomId, context.actor.userId, leaveResult.activeUserIds);
            }
          }
          presenceRegistry.removeConnection(context.connectionId, context.actor.userId);
        }
        registry.unregister(context.connectionId);
      }
      disconnectedSubscriptionSnapshot.clear();
      inboundSeenEventIdsByConnection.clear();
      lastInboundOccurredAtByConnection.clear();
      sequencer.reset();
      log("info", "Realtime runtime stopped.", { path: realtimePath });
    }
  };
};
