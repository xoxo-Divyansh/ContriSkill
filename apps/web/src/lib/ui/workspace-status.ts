import type { RealtimeConnectionState } from "@contriskill/contracts";

export const resolveRealtimeTone = (
  state: RealtimeConnectionState
): "muted" | "warning" | "success" => {
  if (state === "connected") {
    return "success";
  }
  if (state === "reconnecting" || state === "connecting") {
    return "warning";
  }
  return "muted";
};

export const formatSyncSummary = (params: {
  draftPending: number;
  projectionPending: number;
}): string => {
  const draftText = `draft pending: ${params.draftPending}`;
  const projectionText = `projection pending: ${params.projectionPending}`;
  return `${draftText} | ${projectionText}`;
};
