import type { RealtimeScope } from "@contriskill/contracts";

import type {
  RealtimeConnectionContext,
  RealtimeConnectionTarget,
  RealtimeSubscriptionRecord
} from "./types";

const scopeKey = (scope: RealtimeScope): string => {
  return `${scope.type}:${scope.id}`;
};

export class RealtimeConnectionRegistry {
  private readonly contexts = new Map<string, RealtimeConnectionContext>();
  private readonly subscriptionsByConnection = new Map<string, RealtimeSubscriptionRecord[]>();
  private readonly connectionIdsByScope = new Map<string, Set<string>>();
  private readonly connectionIdsByTopic = new Map<string, Set<string>>();

  register(context: RealtimeConnectionContext): void {
    this.contexts.set(context.connectionId, context);
    this.subscriptionsByConnection.set(context.connectionId, []);
  }

  unregister(connectionId: string): void {
    const existingSubscriptions = this.subscriptionsByConnection.get(connectionId) ?? [];
    for (const subscription of existingSubscriptions) {
      const key = scopeKey(subscription.scope);
      const connectedSet = this.connectionIdsByScope.get(key);
      if (!connectedSet) {
        continue;
      }
      connectedSet.delete(connectionId);
      if (connectedSet.size === 0) {
        this.connectionIdsByScope.delete(key);
      }

      const topicSet = this.connectionIdsByTopic.get(subscription.topic);
      if (topicSet) {
        topicSet.delete(connectionId);
        if (topicSet.size === 0) {
          this.connectionIdsByTopic.delete(subscription.topic);
        }
      }
    }

    this.subscriptionsByConnection.delete(connectionId);
    this.contexts.delete(connectionId);
  }

  updateHeartbeat(connectionId: string, heartbeatAt: string): void {
    const context = this.contexts.get(connectionId);
    if (!context) {
      return;
    }

    this.contexts.set(connectionId, {
      ...context,
      lastHeartbeatAt: heartbeatAt
    });
  }

  subscribe(
    connectionId: string,
    scope: RealtimeScope,
    topic: RealtimeSubscriptionRecord["topic"]
  ): RealtimeSubscriptionRecord {
    const existing = this.subscriptionsByConnection.get(connectionId) ?? [];
    const found = existing.find((subscription) => {
      return subscription.topic === topic && scopeKey(subscription.scope) === scopeKey(scope);
    });

    if (found) {
      return found;
    }

    const next: RealtimeSubscriptionRecord = {
      connectionId,
      scope,
      topic,
      subscribedAt: new Date().toISOString()
    };

    this.subscriptionsByConnection.set(connectionId, [...existing, next]);
    const key = scopeKey(scope);
    const connectedSet = this.connectionIdsByScope.get(key) ?? new Set<string>();
    connectedSet.add(connectionId);
    this.connectionIdsByScope.set(key, connectedSet);
    const topicSet = this.connectionIdsByTopic.get(topic) ?? new Set<string>();
    topicSet.add(connectionId);
    this.connectionIdsByTopic.set(topic, topicSet);

    return next;
  }

  unsubscribe(
    connectionId: string,
    scope: RealtimeScope,
    topic: RealtimeSubscriptionRecord["topic"]
  ): boolean {
    const existing = this.subscriptionsByConnection.get(connectionId) ?? [];
    const key = scopeKey(scope);
    const remaining = existing.filter((subscription) => {
      return !(subscription.topic === topic && scopeKey(subscription.scope) === key);
    });

    if (remaining.length === existing.length) {
      return false;
    }

    this.subscriptionsByConnection.set(connectionId, remaining);
    const connectedSet = this.connectionIdsByScope.get(key);
    if (connectedSet) {
      connectedSet.delete(connectionId);
      if (connectedSet.size === 0) {
        this.connectionIdsByScope.delete(key);
      }
    }

    const topicSet = this.connectionIdsByTopic.get(topic);
    if (topicSet) {
      topicSet.delete(connectionId);
      if (topicSet.size === 0) {
        this.connectionIdsByTopic.delete(topic);
      }
    }

    return true;
  }

  get(connectionId: string): RealtimeConnectionContext | undefined {
    return this.contexts.get(connectionId);
  }

  getSubscriptions(connectionId: string): RealtimeSubscriptionRecord[] {
    return [...(this.subscriptionsByConnection.get(connectionId) ?? [])];
  }

  getTargetsByScope(scope: RealtimeScope): RealtimeConnectionTarget[] {
    const key = scopeKey(scope);
    const ids = this.connectionIdsByScope.get(key);
    if (!ids) {
      return [];
    }

    const targets: RealtimeConnectionTarget[] = [];
    for (const connectionId of ids.values()) {
      const context = this.contexts.get(connectionId);
      if (!context) {
        continue;
      }
      targets.push({
        connectionId: context.connectionId,
        actor: context.actor
      });
    }

    return targets;
  }

  getTargetsByTopic(topic: string): RealtimeConnectionTarget[] {
    const ids = this.connectionIdsByTopic.get(topic);
    if (!ids) {
      return [];
    }

    const targets: RealtimeConnectionTarget[] = [];
    for (const connectionId of ids.values()) {
      const context = this.contexts.get(connectionId);
      if (!context) {
        continue;
      }
      targets.push({
        connectionId: context.connectionId,
        actor: context.actor
      });
    }

    return targets;
  }

  getAllConnections(): RealtimeConnectionContext[] {
    return [...this.contexts.values()];
  }
}
