"use client";

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
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiClientError } from "../../../lib/api/types";
import { RedirectIfAuth } from "../../../lib/routing/redirect-if-auth";
import { toSessionSnapshot } from "../../../lib/session/session-mappers";
import { useApiClient } from "../../../providers/api-client-provider";
import { useSession } from "../../../providers/session-provider";

type AuthMode = "sign-in" | "register";

export default function SignInPage() {
  const router = useRouter();
  const { authClient } = useApiClient();
  const { setSession } = useSession();

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const onSubmit = async () => {
    setErrorMessage(undefined);
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        await authClient.register({
          email,
          username,
          password
        });
      }

      const login = await authClient.login({
        identifier: mode === "register" ? email : identifier,
        password
      });

      setSession(
        toSessionSnapshot(login.session.actor, {
          ...(login.session.accessToken ? { accessToken: login.session.accessToken } : {}),
          ...(login.session.refreshToken ? { refreshToken: login.session.refreshToken } : {})
        })
      );
      router.replace("/app");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Authentication request failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RedirectIfAuth>
      <Container as="main" maxWidth="sm" paddingY="xl">
        <Card variant="elevated">
          <CardHeader>
            <Text variant="title">Welcome to ContriSkill</Text>
            <Text tone="muted">Sign in or register to access the contribution workspace.</Text>
          </CardHeader>
          <CardBody>
            <Stack gap="md">
              <Stack direction="row" gap="sm">
                <Button
                  variant={mode === "sign-in" ? "primary" : "secondary"}
                  onClick={() => setMode("sign-in")}
                >
                  Sign In
                </Button>
                <Button
                  variant={mode === "register" ? "primary" : "secondary"}
                  onClick={() => setMode("register")}
                >
                  Register
                </Button>
              </Stack>

              {mode === "register" ? (
                <>
                  <Stack gap="xs">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      value={email}
                      onChange={(event) => setEmail(event.currentTarget.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </Stack>
                  <Stack gap="xs">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      value={username}
                      onChange={(event) => setUsername(event.currentTarget.value)}
                      placeholder="contributor01"
                      autoComplete="username"
                    />
                  </Stack>
                </>
              ) : (
                <Stack gap="xs">
                  <Label htmlFor="sign-in-identifier">Email or Username</Label>
                  <Input
                    id="sign-in-identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.currentTarget.value)}
                    placeholder="you@example.com"
                    autoComplete="username"
                  />
                </Stack>
              )}

              <Stack gap="xs">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  placeholder="********"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </Stack>

              {errorMessage ? (
                <Text variant="caption" tone="danger">
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                onClick={() => void onSubmit()}
                loading={isSubmitting}
                fullWidth
                disabled={
                  mode === "register" ? !email || !username || !password : !identifier || !password
                }
              >
                {mode === "register" ? "Register and Continue" : "Sign In"}
              </Button>
            </Stack>
          </CardBody>
        </Card>
      </Container>
    </RedirectIfAuth>
  );
}
