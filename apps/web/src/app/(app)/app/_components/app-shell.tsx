"use client";

import { Button, Container, Stack, Text } from "@contriskill/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { routePaths } from "../../../../lib/routing/route-policy";
import { useApiClient } from "../../../../providers/api-client-provider";
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
  const { session, clearSession } = useSession();

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
    <Container as="section" maxWidth="xl" paddingY="lg">
      <Stack direction="row" justify="space-between" align="center">
        <Stack gap="xs">
          <Text variant="subtitle">ContriSkill Workspace</Text>
          <Text variant="caption" tone="muted">
            Actor {session.userId ?? "unknown"} ({session.role})
          </Text>
        </Stack>
        <Button variant="secondary" onClick={() => void onSignOut()}>
          Sign Out
        </Button>
      </Stack>

      <Stack direction="row" gap="sm" align="center">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </Stack>

      <Stack gap="xs">
        <Text variant="title">{title}</Text>
        {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
      </Stack>

      {children}
    </Container>
  );
};
