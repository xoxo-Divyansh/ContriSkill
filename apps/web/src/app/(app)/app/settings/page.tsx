"use client";

import { Card, CardBody, CardHeader, Stack, Text } from "@contriskill/ui";

import { AppShell } from "../_components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Session and platform settings shell.">
      <Card variant="subtle">
        <CardHeader>
          <Text variant="subtitle">App Settings</Text>
        </CardHeader>
        <CardBody>
          <Stack gap="xs">
            <Text tone="muted">
              Settings controls are intentionally deferred while keeping route and shell boundaries
              stable.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </AppShell>
  );
}
