import type {
  DraftRealtimeLifecyclePayload,
  SharedDraftPatchEnvelope,
  SharedDraftPatchResultEnvelope,
  SharedDraftSnapshotEnvelope
} from "@contriskill/contracts";

export type DraftPatchStatus =
  | "pending"
  | "optimistic_applied"
  | "acknowledged"
  | "rejected"
  | "conflict"
  | "rolled_back"
  | "retrying"
  | "failed";

export type PendingDraftPatchEntry = {
  envelope: SharedDraftPatchEnvelope;
  status: DraftPatchStatus;
  attempts: number;
  result?: SharedDraftPatchResultEnvelope;
  lastUpdatedAt: string;
};

export type DraftSyncState = {
  localDraft: SharedDraftSnapshotEnvelope | undefined;
  remoteDraft: SharedDraftSnapshotEnvelope | undefined;
  pendingPatches: PendingDraftPatchEntry[];
};

type DraftSyncStore = {
  hydrateRemoteSnapshot: (snapshot: SharedDraftSnapshotEnvelope) => DraftSyncState;
  enqueueOptimisticPatch: (envelope: SharedDraftPatchEnvelope) => {
    state: DraftSyncState;
    entry: PendingDraftPatchEntry;
  };
  applyPatchResult: (result: SharedDraftPatchResultEnvelope) => DraftSyncState;
  applyRealtimeLifecycle: (payload: DraftRealtimeLifecyclePayload) => DraftSyncState;
  markPatchRetrying: (patchId: string) => DraftSyncState;
  rollbackPatch: (patchId: string, reason?: string) => DraftSyncState;
  getState: () => DraftSyncState;
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
  remoteDraft: SharedDraftSnapshotEnvelope | undefined,
  pendingPatches: PendingDraftPatchEntry[]
): SharedDraftSnapshotEnvelope | undefined => {
  if (!remoteDraft) {
    return undefined;
  }

  const projection = pendingPatches
    .filter((entry) => entry.status === "optimistic_applied" || entry.status === "retrying")
    .sort((left, right) => left.envelope.draftVersion - right.envelope.draftVersion)
    .reduce((fields, entry) => patchFields(fields, entry.envelope.patch), remoteDraft.fields);

  return {
    ...remoteDraft,
    fields: projection
  };
};

export const createDraftSyncStore = (initialState?: DraftSyncState): DraftSyncStore => {
  let state: DraftSyncState = {
    localDraft: initialState?.localDraft,
    remoteDraft: initialState?.remoteDraft,
    pendingPatches: initialState?.pendingPatches ?? []
  };

  const setState = (next: DraftSyncState): DraftSyncState => {
    state = {
      ...next,
      localDraft: deriveLocalProjection(next.remoteDraft, next.pendingPatches),
      pendingPatches: [...next.pendingPatches]
    };
    return state;
  };

  const applyResultInternal = (result: SharedDraftPatchResultEnvelope): DraftSyncState => {
    const nextPending = state.pendingPatches.map((entry) => {
      if (entry.envelope.patchId !== result.patchId) {
        return entry;
      }
      const nextStatus: DraftPatchStatus =
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

    const resultEnvelope = state.pendingPatches.find(
      (entry) => entry.envelope.patchId === result.patchId
    );
    const nextRemote =
      result.status === "acknowledged" && resultEnvelope && state.remoteDraft
        ? {
            ...state.remoteDraft,
            draftVersion: Math.max(state.remoteDraft.draftVersion, result.appliedDraftVersion)
          }
        : state.remoteDraft;

    return setState({
      ...state,
      remoteDraft: nextRemote,
      pendingPatches: nextPending
    });
  };

  return {
    hydrateRemoteSnapshot: (snapshot) => {
      const prunedPending = state.pendingPatches.filter((entry) => {
        if (entry.status === "acknowledged") {
          const appliedVersion =
            entry.result?.status === "acknowledged" ? entry.result.appliedDraftVersion : 0;
          return appliedVersion > snapshot.draftVersion;
        }
        return !["rolled_back", "failed"].includes(entry.status);
      });
      return setState({
        ...state,
        remoteDraft: snapshot,
        pendingPatches: prunedPending
      });
    },
    enqueueOptimisticPatch: (envelope) => {
      const existing = state.pendingPatches.find(
        (entry) => entry.envelope.patchId === envelope.patchId
      );
      if (existing) {
        return { state, entry: existing };
      }

      const entry: PendingDraftPatchEntry = {
        envelope,
        status: "optimistic_applied",
        attempts: 1,
        lastUpdatedAt: nowIso()
      };
      const nextState = setState({
        ...state,
        pendingPatches: [...state.pendingPatches, entry]
      });
      return { state: nextState, entry };
    },
    applyPatchResult: (result) => applyResultInternal(result),
    applyRealtimeLifecycle: (payload) => {
      const mappedResult: SharedDraftPatchResultEnvelope =
        payload.status === "acknowledged"
          ? {
              version: 1,
              status: "acknowledged",
              patchId: payload.patchId,
              draftId: payload.draftId,
              targetType: "contribution.post",
              targetId: payload.targetId,
              appliedDraftVersion: payload.appliedDraftVersion ?? 0,
              acknowledgedAt: nowIso()
            }
          : payload.status === "conflict"
            ? {
                version: 1,
                status: "conflict",
                patchId: payload.patchId,
                draftId: payload.draftId,
                targetType: "contribution.post",
                targetId: payload.targetId,
                code: "STALE_BASE",
                message: payload.message ?? "Draft conflict from realtime lifecycle.",
                conflictAt: nowIso()
              }
            : {
                version: 1,
                status: "rejected",
                patchId: payload.patchId,
                draftId: payload.draftId,
                code: "REPLAY_REJECTED",
                message: payload.message ?? "Draft rejected from realtime lifecycle.",
                rejectedAt: nowIso()
              };

      return applyResultInternal(mappedResult);
    },
    markPatchRetrying: (patchId) => {
      return setState({
        ...state,
        pendingPatches: state.pendingPatches.map((entry) => {
          if (entry.envelope.patchId !== patchId) {
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
    rollbackPatch: (patchId, reason) => {
      return setState({
        ...state,
        pendingPatches: state.pendingPatches.map((entry) => {
          if (entry.envelope.patchId !== patchId) {
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
                    patchId: entry.envelope.patchId,
                    draftId: entry.envelope.draftId,
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
