"use client";

import { Card, CardBody, CardHeader, Stack, Text } from "@contriskill/ui";
import Link from "next/link";

import { AppShell } from "./_components/app-shell";

export default function ProtectedAppHomePage() {
  return (
    <AppShell
      title="Workspace Overview"
      subtitle="Stable app shell for auth and contribution flows."
    >
      <Stack gap="md">
        <Card variant="subtle">
          <CardHeader>
            <Text variant="subtitle">Contribution Workspace</Text>
          </CardHeader>
          <CardBody>
            <Stack gap="xs">
              <Text tone="muted">
                Create and manage contributions from the dedicated contribution routes.
              </Text>
              <Link href="/app/contributions">Go to Contributions</Link>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </AppShell>
  );
}
