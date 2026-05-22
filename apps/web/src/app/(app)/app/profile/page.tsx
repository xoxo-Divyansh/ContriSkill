"use client";

import { Text } from "@contriskill/ui";

import {
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../../../../components/workspace/workspace-foundation";
import styles from "../../../../components/workspace/workspace-foundation.module.css";
import { getRealtimeLabel } from "../../../../lib/ui/workspace-status";
import { useRealtime } from "../../../../providers/realtime-provider";
import { useSession } from "../../../../providers/session-provider";
import { AppShell } from "../_components/app-shell";

export default function ProfilePage() {
  const realtime = useRealtime();
  const { session, isReady } = useSession();

  return (
    <AppShell
      title="Platform Identity"
      subtitle="Identity, participation context, and workspace trust cues stay visible even before deeper profile editing arrives."
      contextPanel={
        <WorkspacePanel
          eyebrow="Participation"
          title="Current actor posture"
          description="This route explains who the current collaborator is and why that identity matters to the workspace."
        >
          <div className={styles.metricGrid}>
            <MetricCard label="Role" value={session.role} helper="Platform access layer" />
            <MetricCard
              label="Actor"
              value={session.actorType}
              helper="Identity mode in this session"
            />
          </div>
          <StatusBadge
            label={getRealtimeLabel(realtime.state)}
            tone={
              realtime.state === "connected"
                ? "success"
                : realtime.state === "disconnected"
                  ? "danger"
                  : "warning"
            }
          />
        </WorkspacePanel>
      }
    >
      <WorkspacePanel
        eyebrow="Identity foundation"
        title="What this page now communicates"
        description="ContriSkill is shifting from a technical shell into a more understandable collaborative product, and identity is part of that framing."
      >
        <div className={styles.keyValueList}>
          <div className={styles.keyValueItem}>
            <Text variant="label">Signed-in user</Text>
            <Text tone="muted">{session.userId ?? "Unknown user"}</Text>
          </div>
          <div className={styles.keyValueItem}>
            <Text variant="label">Session state</Text>
            <Text tone="muted">{session.sessionState}</Text>
          </div>
          <div className={styles.keyValueItem}>
            <Text variant="label">Restoration</Text>
            <Text tone="muted">
              {isReady ? "Session context restored" : "Restoring saved session context"}
            </Text>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Why this exists"
        title="Identity helps collaboration feel safer"
        description="Even without a large profile system yet, collaborators need clear signals about who is acting in the workspace and what kind of session they are in."
      >
        <Text tone="muted">
          This page stays intentionally lightweight, but it now reinforces the product identity of a
          shared contribution platform rather than feeling like an empty technical stub.
        </Text>
      </WorkspacePanel>
    </AppShell>
  );
}
