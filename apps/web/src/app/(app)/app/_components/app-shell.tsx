"use client";

import { Button, Container, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { routePaths } from "../../../../lib/routing/route-policy";
import { resolveRealtimeTone } from "../../../../lib/ui/workspace-status";
import { useApiClient } from "../../../../providers/api-client-provider";
import { useRealtime } from "../../../../providers/realtime-provider";
import { useSession } from "../../../../providers/session-provider";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

const navigationItems = [
  { href: routePaths.appHome, label: "Overview" },
  { href: routePaths.contributions, label: "Contributions" },
  { href: routePaths.profile, label: "Profile" },
  { href: routePaths.settings, label: "Settings" }
] as const;

export const AppShell = ({ title, subtitle, children }: AppShellProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { authClient } = useApiClient();
  const { session, clearSession, isReady } = useSession();
  const realtime = useRealtime();

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
    <section className="cs-shell">
      <aside className="cs-shell-sidebar">
        <Stack gap="md">
          <Stack gap="xs">
            <Text variant="subtitle">ContriSkill</Text>
            <Text variant="caption" tone="muted">
              Collaborative Workspace
            </Text>
          </Stack>

          <Stack gap="xs">
            {navigationItems.map((item) => {
              const isActive =
                item.href === routePaths.contributions
                  ? pathname.startsWith(routePaths.contributions)
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="cs-nav-link"
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" tone="muted">
              Signed in as
            </Text>
            <Text variant="caption">
              {session.userId ?? "unknown"} ({session.role})
            </Text>
            <Text variant="caption" tone={resolveRealtimeTone(realtime.state)}>
              Realtime: {realtime.state}
            </Text>
            {!isReady ? (
              <Text variant="caption" tone="warning">
                Restoring session...
              </Text>
            ) : null}
            <Button variant="secondary" onClick={() => void onSignOut()}>
              Sign Out
            </Button>
          </Stack>
        </Stack>
      </aside>

      <main className="cs-shell-main">
        <Container as="section" maxWidth="xl" paddingY="sm" paddingX="sm">
          <Stack gap="md">
            <div className="cs-shell-topbar">
              <Stack gap="xs">
                <Text variant="title">{title}</Text>
                {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
              </Stack>
            </div>
            {children}
          </Stack>
        </Container>
      </main>
    </section>
  );
};
