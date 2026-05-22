import { Container, Text } from "@contriskill/ui";
import Link from "next/link";

import {
  MetricCard,
  StatusBadge,
  WorkspacePanel
} from "../../../components/workspace/workspace-foundation";
import styles from "../../../components/workspace/workspace-foundation.module.css";
import { getWebEnv } from "../../../env";
import { routePaths } from "../../../lib/routing/route-policy";

const webEnv = getWebEnv();
const showFoundationPreview = process.env.NODE_ENV !== "production";

const actionLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "2.75rem",
  padding: "0.75rem 1.25rem",
  borderRadius: "0.75rem",
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#f8fafc",
  textDecoration: "none",
  fontWeight: 600
};

const secondaryActionLinkStyle = {
  ...actionLinkStyle,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a"
};

export default function PublicHomePage() {
  return (
    <Container as="main" maxWidth="xl" paddingY="xxl">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <section className={styles.heroCard}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <StatusBadge label="Platform foundation" tone="success" />
            <Text as="h1" variant="title">
              {webEnv.appName} turns contribution work into a shared platform experience.
            </Text>
            <Text tone="muted">
              ContriSkill helps people discover contribution opportunities, coordinate
              trust-building work, and stay oriented around shared draft, projection, and
              participant state.
            </Text>
            <div className={styles.heroActions}>
              <Link href={routePaths.signIn} style={actionLinkStyle}>
                Enter the workspace
              </Link>
              <Link href="#foundation-summary" style={secondaryActionLinkStyle}>
                Why this exists
              </Link>
            </div>
          </div>
        </section>

        <div className={styles.metricGrid}>
          <MetricCard
            label="Platform identity"
            value="Clearer"
            helper="A stronger collaboration-first point of view"
          />
          <MetricCard
            label="Workspace hierarchy"
            value="Refined"
            helper="Navigation, context rails, and contribution structure"
          />
          <MetricCard
            label="Reliability cues"
            value="Visible"
            helper="Realtime, sync, and session awareness stay in view"
          />
        </div>

        <WorkspacePanel
          id="foundation-summary"
          eyebrow="Why ContriSkill"
          title="A contribution platform built for legibility and shared trust"
          description="This is intentionally a product-facing home, not a broad marketing site."
        >
          <Text tone="muted">
            The platform exists to make contribution work easier to enter, easier to understand, and
            easier to coordinate. Instead of hiding collaboration state behind engineering
            scaffolds, it keeps mission, workflow, and trust signals visible.
          </Text>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="How it works"
          title="A simple collaborative workflow"
          description="The first-time experience now explains the core loop in product language."
        >
          <div className={styles.keyValueList}>
            <div className={styles.keyValueItem}>
              <Text variant="label">1. Create a request</Text>
              <Text tone="muted">
                Frame the contribution need with clear expectations and credits.
              </Text>
            </div>
            <div className={styles.keyValueItem}>
              <Text variant="label">2. Coordinate the workspace</Text>
              <Text tone="muted">
                Track participants, shared draft intent, and projected workspace state.
              </Text>
            </div>
            <div className={styles.keyValueItem}>
              <Text variant="label">3. Build trust through execution</Text>
              <Text tone="muted">
                Keep collaborative state visible so progress and reliability feel concrete.
              </Text>
            </div>
          </div>
        </WorkspacePanel>

        {showFoundationPreview ? (
          <WorkspacePanel
            eyebrow="Dev preview"
            title="Design and platform primitives"
            description="This preview still helps validate the visual system, but now sits inside a clearer product shell."
          >
            <div className={styles.metricGrid}>
              <MetricCard
                label="Typography"
                value="Structured"
                helper="Sharper title, label, and body rhythm"
              />
              <MetricCard
                label="Cards + panels"
                value="Unified"
                helper="Consistent surfaces for product hierarchy"
              />
            </div>
          </WorkspacePanel>
        ) : null}
      </div>
    </Container>
  );
}
