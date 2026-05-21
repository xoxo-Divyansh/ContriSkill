import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Input,
  Label,
  Stack,
  Text
} from "@contriskill/ui";

import { getWebEnv } from "../../../env";

const webEnv = getWebEnv();
const showFoundationPreview = process.env.NODE_ENV !== "production";

export default function PublicHomePage() {
  return (
    <Container as="main" maxWidth="lg" paddingY="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Text as="h1" variant="title">
            {webEnv.appName}
          </Text>
          <Text tone="muted">
            A trust-centered contribution workspace where identity grows through collaboration.
          </Text>
        </Stack>

        {showFoundationPreview ? (
          <Card variant="elevated">
            <CardHeader>
              <Text variant="subtitle">Platform Preview (Dev Only)</Text>
              <Text variant="caption" tone="muted">
                UI primitives, layout rhythm, and interaction baselines.
              </Text>
            </CardHeader>
            <CardBody>
              <Stack gap="md">
                <Stack gap="sm">
                  <Label htmlFor="foundation-preview-input">Workspace Search</Label>
                  <Input id="foundation-preview-input" placeholder="Search contributions..." />
                </Stack>
                <Stack direction="row" gap="sm" wrap>
                  <Button variant="primary">Open Workspace</Button>
                  <Button variant="secondary">View Contributions</Button>
                  <Button variant="ghost">Read Product Docs</Button>
                </Stack>
              </Stack>
            </CardBody>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
