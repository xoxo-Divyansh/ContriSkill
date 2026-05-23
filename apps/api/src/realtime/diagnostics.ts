export type RealtimeDiagnosticsCounters = {
  connectionAttempts: number;
  connectionAccepted: number;
  unauthenticatedRejects: number;
  reconnectTokenMisses: number;
  rejectedEvents: number;
  staleEvents: number;
  duplicateEvents: number;
  outOfOrderEvents: number;
  futureSkewEvents: number;
  sequenceGapEvents: number;
  reconnectAttempts: number;
  reconnectRestores: number;
  replayWindowExpirations: number;
  subscriptionReplayAttempts: number;
  subscriptionReplayRestores: number;
  subscriptionReplayFailures: number;
  heartbeatTimeoutDisconnects: number;
  orphanedPresenceCleanups: number;
  broadcastDispatchFailures: number;
};

export type RealtimeDiagnosticsSnapshot = {
  counters: RealtimeDiagnosticsCounters;
  activeConnections: number;
  reconnectSnapshotCount: number;
  activeConnectionSamples: {
    connectionId: string;
    actorType: string;
    role: string;
    connectedAt: string;
    correlationId?: string;
  }[];
  generatedAt: string;
};

export class RealtimeDiagnostics {
  private counters: RealtimeDiagnosticsCounters = {
    connectionAttempts: 0,
    connectionAccepted: 0,
    unauthenticatedRejects: 0,
    reconnectTokenMisses: 0,
    rejectedEvents: 0,
    staleEvents: 0,
    duplicateEvents: 0,
    outOfOrderEvents: 0,
    futureSkewEvents: 0,
    sequenceGapEvents: 0,
    reconnectAttempts: 0,
    reconnectRestores: 0,
    replayWindowExpirations: 0,
    subscriptionReplayAttempts: 0,
    subscriptionReplayRestores: 0,
    subscriptionReplayFailures: 0,
    heartbeatTimeoutDisconnects: 0,
    orphanedPresenceCleanups: 0,
    broadcastDispatchFailures: 0
  };

  increment(counter: keyof RealtimeDiagnosticsCounters, amount = 1): void {
    this.counters[counter] += amount;
  }

  snapshot(params: {
    activeConnections: number;
    reconnectSnapshotCount: number;
    activeConnectionSamples: RealtimeDiagnosticsSnapshot["activeConnectionSamples"];
  }): RealtimeDiagnosticsSnapshot {
    return {
      counters: { ...this.counters },
      activeConnections: params.activeConnections,
      reconnectSnapshotCount: params.reconnectSnapshotCount,
      activeConnectionSamples: [...params.activeConnectionSamples],
      generatedAt: new Date().toISOString()
    };
  }
}
