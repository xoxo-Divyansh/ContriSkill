"use client";

import { Button, Container, Stack, Text } from "@contriskill/ui";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { RequireAuth } from "../../lib/routing/require-auth";
import { useApiClient } from "../../providers/api-client-provider";
import { useSession } from "../../providers/session-provider";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
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
      router.replace("/sign-in");
    }
  };

  return (
    <RequireAuth>
      <Container as="section" maxWidth="xl" paddingY="lg">
        <Stack direction="row" justify="space-between" align="center">
          <Stack gap="xs">
            <Text variant="subtitle">Contribution Workspace</Text>
            <Text variant="caption" tone="muted">
              Signed in as {session.userId ?? "unknown actor"}
            </Text>
          </Stack>
          <Button variant="secondary" onClick={() => void onSignOut()}>
            Sign Out
          </Button>
        </Stack>
        {children}
      </Container>
    </RequireAuth>
  );
}
