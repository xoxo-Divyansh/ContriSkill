import { randomUUID } from "node:crypto";

import type {
  WorkspaceSessionCapability,
  WorkspaceSessionParticipant
} from "@contriskill/contracts";

type WorkspaceActorKey = string;

const nowIso = (): string => new Date().toISOString();

const workspaceActorKey = (workspaceId: string, actorId: string): WorkspaceActorKey => {
  return `${workspaceId}:${actorId}`;
};

type MutableWorkspaceSession = WorkspaceSessionParticipant & {
  connectionIds: string[];
  capabilities: WorkspaceSessionCapability[];
};

type JoinInput = {
  workspaceId: string;
  targetId: string;
  actorId: string;
  clientId: string;
  connectionId: string;
  capabilities: WorkspaceSessionCapability[];
  metadata?: {
    displayName?: string;
  };
};

type LeaveInput = {
  workspaceId: string;
  actorId: string;
  connectionId: string;
};

type JoinResult = {
  joined: boolean;
  updated: boolean;
  session: WorkspaceSessionParticipant;
  participants: WorkspaceSessionParticipant[];
};

type LeaveResult = {
  left: boolean;
  session?: WorkspaceSessionParticipant;
  participants: WorkspaceSessionParticipant[];
};

type StaleSessionRecord = {
  workspaceId: string;
  targetId: string;
  session: WorkspaceSessionParticipant;
  participants: WorkspaceSessionParticipant[];
};

export class RealtimeWorkspaceSessionRegistry {
  private readonly sessionsByWorkspaceActor = new Map<WorkspaceActorKey, MutableWorkspaceSession>();
  private readonly workspaceActors = new Map<string, Set<string>>();
  private readonly workspacesByConnection = new Map<string, Set<string>>();

  joinSession(input: JoinInput): JoinResult {
    const actorKey = workspaceActorKey(input.workspaceId, input.actorId);
    const existing = this.sessionsByWorkspaceActor.get(actorKey);
    const now = nowIso();

    if (existing) {
      const hadConnection = existing.connectionIds.includes(input.connectionId);
      if (!hadConnection) {
        existing.connectionIds = [...existing.connectionIds, input.connectionId];
      }
      existing.lastSeenAt = now;
      existing.sessionState = "active";
      existing.capabilities = [...input.capabilities];
      existing.clientId = input.clientId;
      if (input.metadata) {
        existing.metadata = input.metadata;
      } else {
        delete existing.metadata;
      }
      this.sessionsByWorkspaceActor.set(actorKey, existing);
      this.bindConnectionToWorkspace(input.connectionId, input.workspaceId);
      return {
        joined: false,
        updated: !hadConnection,
        session: this.toParticipant(existing),
        participants: this.getParticipantsByWorkspace(input.workspaceId)
      };
    }

    const session: MutableWorkspaceSession = {
      workspaceSessionId: `wss_${randomUUID()}`,
      workspaceId: input.workspaceId,
      targetId: input.targetId,
      actorId: input.actorId,
      clientId: input.clientId,
      connectionIds: [input.connectionId],
      sessionState: "active",
      joinedAt: now,
      lastSeenAt: now,
      capabilities: [...input.capabilities],
      ...(input.metadata ? { metadata: input.metadata } : {})
    };
    this.sessionsByWorkspaceActor.set(actorKey, session);

    const actors = this.workspaceActors.get(input.workspaceId) ?? new Set<string>();
    actors.add(input.actorId);
    this.workspaceActors.set(input.workspaceId, actors);

    this.bindConnectionToWorkspace(input.connectionId, input.workspaceId);

    return {
      joined: true,
      updated: false,
      session: this.toParticipant(session),
      participants: this.getParticipantsByWorkspace(input.workspaceId)
    };
  }

  leaveSession(input: LeaveInput): LeaveResult {
    const actorKey = workspaceActorKey(input.workspaceId, input.actorId);
    const existing = this.sessionsByWorkspaceActor.get(actorKey);
    if (!existing) {
      return {
        left: false,
        participants: this.getParticipantsByWorkspace(input.workspaceId)
      };
    }

    existing.connectionIds = existing.connectionIds.filter((id) => id !== input.connectionId);
    this.unbindConnectionFromWorkspace(input.connectionId, input.workspaceId);

    if (existing.connectionIds.length > 0) {
      existing.lastSeenAt = nowIso();
      existing.sessionState = "active";
      this.sessionsByWorkspaceActor.set(actorKey, existing);
      return {
        left: false,
        session: this.toParticipant(existing),
        participants: this.getParticipantsByWorkspace(input.workspaceId)
      };
    }

    this.sessionsByWorkspaceActor.delete(actorKey);
    const actors = this.workspaceActors.get(input.workspaceId);
    if (actors) {
      actors.delete(input.actorId);
      if (actors.size === 0) {
        this.workspaceActors.delete(input.workspaceId);
      }
    }

    const finalSession: WorkspaceSessionParticipant = {
      ...this.toParticipant(existing),
      sessionState: "left",
      connectionIds: []
    };

    return {
      left: true,
      session: finalSession,
      participants: this.getParticipantsByWorkspace(input.workspaceId)
    };
  }

  touchConnection(connectionId: string): void {
    const workspaces = this.workspacesByConnection.get(connectionId);
    if (!workspaces) {
      return;
    }
    const now = nowIso();
    for (const workspaceId of workspaces.values()) {
      const actors = this.workspaceActors.get(workspaceId);
      if (!actors) {
        continue;
      }
      for (const actorId of actors.values()) {
        const key = workspaceActorKey(workspaceId, actorId);
        const session = this.sessionsByWorkspaceActor.get(key);
        if (!session || !session.connectionIds.includes(connectionId)) {
          continue;
        }
        session.lastSeenAt = now;
        this.sessionsByWorkspaceActor.set(key, session);
      }
    }
  }

  removeConnection(connectionId: string): StaleSessionRecord[] {
    const staleRecords: StaleSessionRecord[] = [];
    const workspaces = [
      ...(this.workspacesByConnection.get(connectionId) ?? new Set<string>()).values()
    ];
    for (const workspaceId of workspaces) {
      const actors = [...(this.workspaceActors.get(workspaceId) ?? new Set<string>()).values()];
      for (const actorId of actors) {
        const leaveResult = this.leaveSession({ workspaceId, actorId, connectionId });
        if (leaveResult.left && leaveResult.session) {
          staleRecords.push({
            workspaceId,
            targetId: leaveResult.session.targetId,
            session: {
              ...leaveResult.session,
              sessionState: "stale"
            },
            participants: leaveResult.participants
          });
        }
      }
    }
    this.workspacesByConnection.delete(connectionId);
    return staleRecords;
  }

  cleanupStaleSessions(staleThresholdMs: number): StaleSessionRecord[] {
    const now = Date.now();
    const staleRecords: StaleSessionRecord[] = [];
    for (const [key, session] of this.sessionsByWorkspaceActor.entries()) {
      const lastSeen = Date.parse(session.lastSeenAt);
      if (!Number.isFinite(lastSeen) || now - lastSeen <= staleThresholdMs) {
        continue;
      }
      this.sessionsByWorkspaceActor.delete(key);
      const actors = this.workspaceActors.get(session.workspaceId);
      if (actors) {
        actors.delete(session.actorId);
        if (actors.size === 0) {
          this.workspaceActors.delete(session.workspaceId);
        }
      }
      staleRecords.push({
        workspaceId: session.workspaceId,
        targetId: session.targetId,
        session: {
          ...this.toParticipant(session),
          sessionState: "stale",
          connectionIds: []
        },
        participants: this.getParticipantsByWorkspace(session.workspaceId)
      });
    }
    return staleRecords;
  }

  getParticipantsByWorkspace(workspaceId: string): WorkspaceSessionParticipant[] {
    const actors = this.workspaceActors.get(workspaceId);
    if (!actors) {
      return [];
    }
    const participants: WorkspaceSessionParticipant[] = [];
    for (const actorId of actors.values()) {
      const session = this.sessionsByWorkspaceActor.get(workspaceActorKey(workspaceId, actorId));
      if (!session) {
        continue;
      }
      participants.push(this.toParticipant(session));
    }
    return participants.sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
  }

  private bindConnectionToWorkspace(connectionId: string, workspaceId: string): void {
    const workspaces = this.workspacesByConnection.get(connectionId) ?? new Set<string>();
    workspaces.add(workspaceId);
    this.workspacesByConnection.set(connectionId, workspaces);
  }

  private unbindConnectionFromWorkspace(connectionId: string, workspaceId: string): void {
    const workspaces = this.workspacesByConnection.get(connectionId);
    if (!workspaces) {
      return;
    }
    workspaces.delete(workspaceId);
    if (workspaces.size === 0) {
      this.workspacesByConnection.delete(connectionId);
      return;
    }
    this.workspacesByConnection.set(connectionId, workspaces);
  }

  private toParticipant(session: MutableWorkspaceSession): WorkspaceSessionParticipant {
    return {
      ...session,
      connectionIds: [...session.connectionIds],
      capabilities: [...session.capabilities]
    };
  }
}
