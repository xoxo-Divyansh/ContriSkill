export const workspaceSessionVersion = 1 as const;

export const workspaceSessionStates = ["active", "reconnecting", "stale", "left"] as const;

export type WorkspaceSessionState = (typeof workspaceSessionStates)[number];

export type WorkspaceSessionCapability =
  | "workspace:session:join"
  | "draft:sync"
  | "projection:sync";

export type WorkspaceSessionMetadata = {
  displayName?: string;
};

export type WorkspaceSessionParticipant = {
  workspaceSessionId: string;
  workspaceId: string;
  targetId: string;
  actorId: string;
  clientId: string;
  connectionIds: string[];
  sessionState: WorkspaceSessionState;
  joinedAt: string;
  lastSeenAt: string;
  capabilities: WorkspaceSessionCapability[];
  metadata?: WorkspaceSessionMetadata;
};

export type WorkspaceSessionJoinedEnvelope = {
  version: typeof workspaceSessionVersion;
  kind: "joined";
  workspaceId: string;
  targetId: string;
  session: WorkspaceSessionParticipant;
};

export type WorkspaceSessionLeftEnvelope = {
  version: typeof workspaceSessionVersion;
  kind: "left";
  workspaceId: string;
  targetId: string;
  workspaceSessionId: string;
  actorId: string;
  sessionState: "left" | "stale";
  leftAt: string;
};

export type WorkspaceSessionUpdatedEnvelope = {
  version: typeof workspaceSessionVersion;
  kind: "updated";
  workspaceId: string;
  targetId: string;
  session: WorkspaceSessionParticipant;
};

export type WorkspaceSessionSnapshotEnvelope = {
  version: typeof workspaceSessionVersion;
  kind: "snapshot";
  workspaceId: string;
  targetId: string;
  participants: WorkspaceSessionParticipant[];
  generatedAt: string;
};
