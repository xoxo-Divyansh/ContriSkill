import type {
  ProjectionRealtimeLifecyclePayload,
  SharedProjectionSnapshotEnvelope,
  SharedProjectionUpdateEnvelope,
  SharedProjectionUpdateResultEnvelope
} from "@contriskill/contracts";

export type ProjectionUpdateStatus =
  | "pending"
  | "optimistic_applied"
  | "acknowledged"
  | "rejected"
  | "conflict"
  | "rolled_back"
  | "retrying"
  | "failed";

export type PendingProjectionUpdateEntry = {
  envelope: SharedProjectionUpdateEnvelope;
  status: ProjectionUpdateStatus;
  attempts: number;
  result?: SharedProjectionUpdateResultEnvelope;
  lastUpdatedAt: string;
};

export type ProjectionSyncState = {
  localProjection: SharedProjectionSnapshotEnvelope | undefined;
  remoteProjection: SharedProjectionSnapshotEnvelope | undefined;
  pendingUpdates: PendingProjectionUpdateEntry[];
};

type ProjectionSyncStore = {
  hydrateRemoteSnapshot: (snapshot: SharedProjectionSnapshotEnvelope) => ProjectionSyncState;
  enqueueOptimisticUpdate: (envelope: SharedProjectionUpdateEnvelope) => {
    state: ProjectionSyncState;
    entry: PendingProjectionUpdateEntry;
  };
  applyUpdateResult: (result: SharedProjectionUpdateResultEnvelope) => ProjectionSyncState;
  applyRealtimeLifecycle: (payload: ProjectionRealtimeLifecyclePayload) => ProjectionSyncState;
  markUpdateRetrying: (updateId: string) => ProjectionSyncState;
  rollbackUpdate: (updateId: string, reason?: string) => ProjectionSyncState;
  getState: () => ProjectionSyncState;
};

const nowIso = (): string => new Date().toISOString();

const patchFields = (
  fields: Record<string, string>,
  patch: Record<string, string | null>
): Record<string, string> => {
  const next = { ...fields };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete next[key];
      continue;
    }
    next[key] = value;
  }
  return next;
};

const deriveLocalProjection = (
  remoteProjection: SharedProjectionSnapshotEnvelope | undefined,
  pendingUpdates: PendingProjectionUpdateEntry[]
): SharedProjectionSnapshotEnvelope | undefined => {
  if (!remoteProjection) {
    return undefined;
  }

  const projection = pendingUpdates
    .filter((entry) => entry.status === "optimistic_applied" || entry.status === "retrying")
    .sort((left, right) => left.envelope.projectionVersion - right.envelope.projectionVersion)
    .reduce((fields, entry) => patchFields(fields, entry.envelope.patch), remoteProjection.fields);

  return {
    ...remoteProjection,
    fields: projection
  };
};

export const createProjectionSyncStore = (
  initialState?: ProjectionSyncState
): ProjectionSyncStore => {
  let state: ProjectionSyncState = {
    localProjection: initialState?.localProjection,
    remoteProjection: initialState?.remoteProjection,
    pendingUpdates: initialState?.pendingUpdates ?? []
  };

  const setState = (next: ProjectionSyncState): ProjectionSyncState => {
    state = {
      ...next,
      localProjection: deriveLocalProjection(next.remoteProjection, next.pendingUpdates),
      pendingUpdates: [...next.pendingUpdates]
    };
    return state;
  };

  const applyResultInternal = (
    result: SharedProjectionUpdateResultEnvelope
  ): ProjectionSyncState => {
    const nextPending = state.pendingUpdates.map((entry) => {
      if (entry.envelope.updateId !== result.updateId) {
        return entry;
      }
      const nextStatus: ProjectionUpdateStatus =
        result.status === "acknowledged"
          ? "acknowledged"
          : result.status === "conflict"
            ? "conflict"
            : "rejected";
      return {
        ...entry,
        status: nextStatus,
        result,
        lastUpdatedAt: nowIso()
      };
    });

    const resultEnvelope = state.pendingUpdates.find(
      (entry) => entry.envelope.updateId === result.updateId
    );
    const nextRemote =
      result.status === "acknowledged" && resultEnvelope && state.remoteProjection
        ? {
            ...state.remoteProjection,
            projectionVersion: Math.max(
              state.remoteProjection.projectionVersion,
              result.appliedProjectionVersion
            )
          }
        : state.remoteProjection;

    return setState({
      ...state,
      remoteProjection: nextRemote,
      pendingUpdates: nextPending
    });
  };

  return {
    hydrateRemoteSnapshot: (snapshot) => {
      const prunedPending = state.pendingUpdates.filter((entry) => {
        if (entry.status === "acknowledged") {
          const appliedVersion =
            entry.result?.status === "acknowledged" ? entry.result.appliedProjectionVersion : 0;
          return appliedVersion > snapshot.projectionVersion;
        }
        return !["rolled_back", "failed"].includes(entry.status);
      });
      return setState({
        ...state,
        remoteProjection: snapshot,
        pendingUpdates: prunedPending
      });
    },
    enqueueOptimisticUpdate: (envelope) => {
      const existing = state.pendingUpdates.find(
        (entry) => entry.envelope.updateId === envelope.updateId
      );
      if (existing) {
        return { state, entry: existing };
      }

      const entry: PendingProjectionUpdateEntry = {
        envelope,
        status: "optimistic_applied",
        attempts: 1,
        lastUpdatedAt: nowIso()
      };

      const nextState = setState({
        ...state,
        pendingUpdates: [...state.pendingUpdates, entry]
      });
      return { state: nextState, entry };
    },
    applyUpdateResult: (result) => applyResultInternal(result),
    applyRealtimeLifecycle: (payload) => {
      const mapped: SharedProjectionUpdateResultEnvelope =
        payload.status === "acknowledged"
          ? {
              version: 1,
              status: "acknowledged",
              updateId: payload.updateId,
              projectionId: payload.projectionId,
              workspaceId: payload.workspaceId,
              targetType: "contribution.workspace",
              targetId: payload.targetId,
              appliedProjectionVersion: payload.appliedProjectionVersion ?? 0,
              acknowledgedAt: nowIso()
            }
          : payload.status === "conflict"
            ? {
                version: 1,
                status: "conflict",
                updateId: payload.updateId,
                projectionId: payload.projectionId,
                workspaceId: payload.workspaceId,
                targetType: "contribution.workspace",
                targetId: payload.targetId,
                code: "STALE_BASE",
                message: payload.message ?? "Projection conflict from realtime lifecycle.",
                conflictAt: nowIso()
              }
            : {
                version: 1,
                status: "rejected",
                updateId: payload.updateId,
                projectionId: payload.projectionId,
                code: "REPLAY_REJECTED",
                message: payload.message ?? "Projection rejected from realtime lifecycle.",
                rejectedAt: nowIso()
              };
      return applyResultInternal(mapped);
    },
    markUpdateRetrying: (updateId) => {
      return setState({
        ...state,
        pendingUpdates: state.pendingUpdates.map((entry) => {
          if (entry.envelope.updateId !== updateId) {
            return entry;
          }
          return {
            ...entry,
            status: "retrying",
            attempts: entry.attempts + 1,
            lastUpdatedAt: nowIso()
          };
        })
      });
    },
    rollbackUpdate: (updateId, reason) => {
      return setState({
        ...state,
        pendingUpdates: state.pendingUpdates.map((entry) => {
          if (entry.envelope.updateId !== updateId) {
            return entry;
          }
          return {
            ...entry,
            status: "rolled_back",
            lastUpdatedAt: nowIso(),
            ...(reason
              ? {
                  result: {
                    version: 1,
                    status: "rejected",
                    updateId: entry.envelope.updateId,
                    projectionId: entry.envelope.projectionId,
                    code: "REPLAY_REJECTED",
                    message: reason,
                    rejectedAt: nowIso()
                  }
                }
              : {})
          };
        })
      });
    },
    getState: () => state
  };
};
