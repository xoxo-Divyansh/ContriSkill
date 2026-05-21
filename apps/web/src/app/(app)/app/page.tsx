"use client";

import { Card, CardBody, CardHeader, Stack, Text } from "@contriskill/ui";
import Link from "next/link";

import { AppShell } from "./_components/app-shell";

export default function ProtectedAppHomePage() {
  return (
    <AppShell
      title="Workspace Overview"
      subtitle="Your collaborative control surface for contribution work."
    >
      <Stack gap="sm">
        <Card variant="outlined">
          <CardHeader>
            <Text variant="subtitle">Contribution Workspace</Text>
          </CardHeader>
          <CardBody>
            <Stack gap="xs">
              <Text tone="muted">
                Create requests, manage collaboration applications, and monitor synchronization
                state from dedicated workspace routes.
              </Text>
              <Link href="/app/contributions">Go to Contributions</Link>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </AppShell>
  );
}
