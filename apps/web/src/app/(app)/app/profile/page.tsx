"use client";

import { Card, CardBody, CardHeader, Stack, Text } from "@contriskill/ui";

import { AppShell } from "../_components/app-shell";

export default function ProfilePage() {
  return (
    <AppShell title="Profile" subtitle="Current actor profile shell for Sprint foundation.">
      <Card variant="subtle">
        <CardHeader>
          <Text variant="subtitle">Profile Settings</Text>
        </CardHeader>
        <CardBody>
          <Stack gap="xs">
            <Text tone="muted">
              Profile management UI is intentionally scoped as shell-only in this stage.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </AppShell>
  );
}
