"use client";

import { Button, Text } from "@contriskill/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { StatusBadge, WorkspacePanel } from "../../../../components/workspace/workspace-foundation";
import styles from "../../../../components/workspace/workspace-foundation.module.css";
import { routePaths } from "../../../../lib/routing/route-policy";
import { getRealtimeLabel, resolveRealtimeTone } from "../../../../lib/ui/workspace-status";
import { useApiClient } from "../../../../providers/api-client-provider";
import { useRealtime } from "../../../../providers/realtime-provider";
import { useSession } from "../../../../providers/session-provider";

import shellStyles from "./app-shell.module.css";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contextPanel?: ReactNode;
};

const navigationItems = [
  { href: routePaths.appHome, label: "Overview", match: "exact" },
  { href: routePaths.contributions, label: "Contributions", match: "prefix" },
  { href: routePaths.profile, label: "Profile", match: "exact" },
  { href: routePaths.settings, label: "Settings", match: "exact" }
] as const;

const isActiveRoute = (pathname: string, href: string, match: "exact" | "prefix") => {
  return match === "prefix"
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
};

export const AppShell = ({ title, subtitle, children, contextPanel }: AppShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const realtime = useRealtime();
  const { authClient } = useApiClient();
  const { session, clearSession, isReady } = useSession();

  const onSignOut = async () => {
    try {
      await authClient.logout(
        session.accessToken ? { accessToken: session.accessToken } : undefined
      );
    } finally {
      clearSession();
      router.replace(routePaths.signIn);
    }
  };

  return (
    <div className={shellStyles.shell}>
      <aside className={shellStyles.sidebar}>
        <WorkspacePanel
          eyebrow="Platform"
          title="ContriSkill"
          description="A collaborative contribution platform where coordination, trust, and visibility all stay legible."
          subtle
        >
          <StatusBadge label={session.role} />
          <Text variant="caption" tone="muted">
            Signed in as {session.userId ?? "unknown"}.
          </Text>
        </WorkspacePanel>

        <nav aria-label="Workspace navigation" className={shellStyles.nav}>
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href, item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`${shellStyles.navLink} ${isActive ? shellStyles.navLinkActive : ""}`}
              >
                <Text variant="label">{item.label}</Text>
                <Text variant="caption" tone={isActive ? "default" : "muted"}>
                  {item.href === routePaths.appHome
                    ? "Platform overview and workspace posture"
                    : item.href === routePaths.contributions
                      ? "Requests, workflow, and collaborative state"
                      : item.href === routePaths.profile
                        ? "Identity and participation context"
                        : "Session and platform reliability surfaces"}
                </Text>
              </Link>
            );
          })}
        </nav>

        <div className={shellStyles.sidebarFooter}>
          <WorkspacePanel
            eyebrow="Session"
            title="Current workspace context"
            description="Persistent identity and connection cues keep the platform grounded while you move between routes."
          >
            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>State</p>
                <p className={styles.metricValue} style={{ fontSize: "1.125rem" }}>
                  {session.sessionState}
                </p>
              </div>
              <div className={styles.metricCard}>
                <p className={styles.metricLabel}>Access</p>
                <p className={styles.metricValue} style={{ fontSize: "1.125rem" }}>
                  {session.actorType}
                </p>
              </div>
            </div>
            <StatusBadge
              label={getRealtimeLabel(realtime.state)}
              tone={
                realtime.state === "connected"
                  ? "success"
                  : realtime.state === "connecting" || realtime.state === "reconnecting"
                    ? "warning"
                    : "danger"
              }
            />
            {!isReady ? (
              <Text variant="caption" tone="warning">
                Restoring your session and workspace context…
              </Text>
            ) : null}
          </WorkspacePanel>

          <Button variant="secondary" fullWidth onClick={() => void onSignOut()}>
            Sign Out
          </Button>
        </div>
      </aside>

      <div className={shellStyles.mainColumn}>
        <header className={shellStyles.topbar}>
          <div>
            <Text variant="label">Collaborative Platform Workspace</Text>
            <Text tone="muted">
              Shared contribution work with clearer hierarchy, sync visibility, and onboarding
              context.
            </Text>
          </div>
          <div className={shellStyles.topbarActions}>
            <StatusBadge
              label={getRealtimeLabel(realtime.state)}
              tone={
                resolveRealtimeTone(realtime.state) === "success"
                  ? "success"
                  : resolveRealtimeTone(realtime.state) === "warning"
                    ? "warning"
                    : resolveRealtimeTone(realtime.state) === "danger"
                      ? "danger"
                      : "default"
              }
            />
            <StatusBadge label={`Session ${session.sessionState}`} />
          </div>
        </header>

        <div className={shellStyles.contentWrap}>
          <div className={shellStyles.contentGrid}>
            <main className={shellStyles.primaryColumn}>
              <div className={shellStyles.pageHeader}>
                <Text variant="title">{title}</Text>
                {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
              </div>
              {children}
            </main>
            {contextPanel ? (
              <aside className={shellStyles.contextColumn}>{contextPanel}</aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
