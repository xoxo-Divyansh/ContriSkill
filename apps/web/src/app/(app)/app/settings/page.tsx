"use client";

import { Text } from "@contriskill/ui";

import {
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../../../../components/workspace/workspace-foundation";
import styles from "../../../../components/workspace/workspace-foundation.module.css";
import { getRealtimeLabel, resolveRealtimeTone } from "../../../../lib/ui/workspace-status";
import { useRealtime } from "../../../../providers/realtime-provider";
import { useSession } from "../../../../providers/session-provider";
import { AppShell } from "../_components/app-shell";

export default function SettingsPage() {
  const realtime = useRealtime();
  const { session, isReady } = useSession();

  const realtimeTone =
    resolveRealtimeTone(realtime.state) === "success"
      ? "success"
      : resolveRealtimeTone(realtime.state) === "warning"
        ? "warning"
        : resolveRealtimeTone(realtime.state) === "danger"
          ? "danger"
          : "default";

  return (
    <AppShell
      title="Platform Reliability"
      subtitle="Session restoration, sync posture, and defensive workspace messaging stay grouped in one calm route."
      contextPanel={
        <WorkspacePanel
          eyebrow="Connection state"
          title="Reliability posture"
          description="This route keeps the platform honest about connection health and session continuity."
        >
          <div className={styles.metricGrid}>
            <MetricCard
              label="Session"
              value={session.sessionState}
              helper="Current continuity state"
            />
            <MetricCard
              label="Realtime"
              value={realtime.state}
              helper="Live collaboration transport state"
            />
          </div>
          <StatusBadge label={getRealtimeLabel(realtime.state)} tone={realtimeTone} />
        </WorkspacePanel>
      }
    >
      <WorkspacePanel
        eyebrow="Session restoration"
        title="Persistence with clearer feedback"
        description="The platform now explains when it is restoring saved context instead of leaving the workspace ambiguous."
      >
        <Text tone="muted">
          {isReady
            ? "Saved session context is available, so the workspace can recover quickly after refresh."
            : "The platform is currently restoring saved session context before the workspace fully settles."}
        </Text>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Reliability UX"
        title="What users should understand here"
        description="This page anchors the product around predictable behavior rather than hidden system state."
      >
        <div className={styles.keyValueList}>
          <div className={styles.keyValueItem}>
            <Text variant="label">Realtime visibility</Text>
            <Text tone="muted">
              Connection quality remains visible in the shell and in route-level surfaces.
            </Text>
          </div>
          <div className={styles.keyValueItem}>
            <Text variant="label">Session clarity</Text>
            <Text tone="muted">
              Authentication posture and actor identity stay visible across routes.
            </Text>
          </div>
          <div className={styles.keyValueItem}>
            <Text variant="label">Defensive rendering</Text>
            <Text tone="muted">
              Empty, loading, and degraded states now read like product surfaces instead of
              engineering placeholders.
            </Text>
          </div>
        </div>
      </WorkspacePanel>
    </AppShell>
  );
}
