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
        <Text as="h1" variant="title">
          {webEnv.appName} Public Landing
        </Text>
        <Text tone="muted">
          Public route-group shell is active. Feature pages are intentionally deferred.
        </Text>

        {showFoundationPreview ? (
          <Card variant="elevated">
            <CardHeader>
              <Text variant="subtitle">Foundation Preview (Dev Only)</Text>
              <Text variant="caption" tone="muted">
                Primitive import and token alignment verification surface.
              </Text>
            </CardHeader>
            <CardBody>
              <Stack gap="sm">
                <Label htmlFor="foundation-preview-input">Sample Input</Label>
                <Input id="foundation-preview-input" placeholder="Type-safe primitive input" />
              </Stack>
              <Stack direction="row" gap="sm">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
              </Stack>
            </CardBody>
          </Card>
        ) : null}
      </Stack>
    </Container>
  );
}
