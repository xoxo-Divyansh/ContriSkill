"use client";

import { Button, Stack, Text } from "@contriskill/ui";
import { useRouter } from "next/navigation";

import {
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../../../components/workspace/workspace-foundation";
import styles from "../../../components/workspace/workspace-foundation.module.css";
import { getRealtimeLabel } from "../../../lib/ui/workspace-status";
import { useRealtime } from "../../../providers/realtime-provider";
import { useSession } from "../../../providers/session-provider";

import { AppShell } from "./_components/app-shell";

export default function ProtectedAppHomePage() {
  const router = useRouter();
  const realtime = useRealtime();
  const { session } = useSession();

  return (
    <AppShell
      title="Workspace Overview"
      subtitle="A product-oriented control surface for contribution work, participant visibility, and shared platform trust."
      contextPanel={
        <>
          <WorkspacePanel
            eyebrow="Platform posture"
            title="Current workspace context"
            description="The platform keeps identity, session, and connectivity visible while people orient themselves."
          >
            <div className={styles.metricGrid}>
              <MetricCard label="Role" value={session.role} helper="Current platform access" />
              <MetricCard
                label="Session"
                value={session.sessionState}
                helper="Auth and continuity"
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

          <WorkspacePanel
            eyebrow="Why this platform"
            title="Contribution work should be legible"
            description="ContriSkill helps people understand what exists, how to participate, and which collaboration states matter."
          >
            <Text tone="muted">
              This foundation is no longer just a technical shell. It now behaves more like a real
              collaborative product surface, with clearer mission messaging and more reliable
              hierarchy.
            </Text>
          </WorkspacePanel>
        </>
      }
    >
      <div className={styles.metricGrid}>
        <MetricCard
          label="Contribution flow"
          value="Ready"
          helper="Create, browse, and inspect workspace activity"
        />
        <MetricCard
          label="Collaboration cues"
          value="Visible"
          helper="Participants, sessions, and sync state stay readable"
        />
        <MetricCard
          label="Onboarding clarity"
          value="Improved"
          helper="The platform explains itself more clearly"
        />
      </div>

      <WorkspacePanel
        eyebrow="Next actions"
        title="Pick up your next collaboration move"
        description="The overview route now acts like a real product landing zone after sign-in."
      >
        <Stack gap="md">
          <Text tone="muted">
            Use the contribution workspace to frame a request, inspect active coordination state,
            and keep shared draft or projection activity visible while collaborators work through
            the flow.
          </Text>
          <Stack direction="row" gap="sm" wrap>
            <Button onClick={() => router.push("/app/contributions")}>Open Contributions</Button>
            <Button variant="secondary" onClick={() => router.push("/app/profile")}>
              Review Platform Identity
            </Button>
          </Stack>
        </Stack>
      </WorkspacePanel>

      <WorkspacePanel
        eyebrow="Platform lanes"
        title="How the workspace is organized"
        description="The app shell now groups the product around the most meaningful collaborative surfaces."
      >
        <div className={styles.keyValueList}>
          <div className={styles.keyValueItem}>
            <Text variant="label">Navigation</Text>
            <Text tone="muted">
              Persistent route hierarchy, active workspace state, and better product framing.
            </Text>
          </div>
          <div className={styles.keyValueItem}>
            <Text variant="label">Contribution workflow</Text>
            <Text tone="muted">
              Create, browse, and inspect contribution work with clearer metadata hierarchy.
            </Text>
          </div>
          <div className={styles.keyValueItem}>
            <Text variant="label">Reliability surfaces</Text>
            <Text tone="muted">
              Realtime, session restoration, and sync indicators remain visible and calm.
            </Text>
          </div>
        </div>
      </WorkspacePanel>
    </AppShell>
  );
}
