import type { RealtimeConnectionState } from "@contriskill/contracts";

export const resolveRealtimeTone = (
  state: RealtimeConnectionState
): "muted" | "warning" | "success" | "danger" => {
  if (state === "connected") {
    return "success";
  }

  if (state === "reconnecting" || state === "connecting") {
    return "warning";
  }

  return state === "disconnected" ? "danger" : "muted";
};

export const getRealtimeLabel = (state: RealtimeConnectionState): string => {
  if (state === "connected") {
    return "Realtime connected";
  }

  if (state === "reconnecting") {
    return "Realtime reconnecting";
  }

  if (state === "connecting") {
    return "Realtime connecting";
  }

  return "Realtime offline";
};

export const formatSyncSummary = (params: {
  draftPending: number;
  projectionPending: number;
}): string => {
  const draftText = `draft pending ${params.draftPending}`;
  const projectionText = `projection pending ${params.projectionPending}`;

  return `${draftText} / ${projectionText}`;
};

export const getSyncSurfaceLabel = (params: {
  isSyncing: boolean;
  hasError: boolean;
  hasStatus: boolean;
  idleLabel: string;
}): string => {
  if (params.hasError) {
    return "Needs attention";
  }

  if (params.isSyncing) {
    return "Syncing";
  }

  if (params.hasStatus) {
    return "Synchronized";
  }

  return params.idleLabel;
};
