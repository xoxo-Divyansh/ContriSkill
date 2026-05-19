"use client";

import React, { type ReactNode } from "react";

import type { WebEnv } from "../env";
import type { SessionSnapshot } from "../types/session";

import type { ApiClientProviderValue } from "./api-client-provider";
import { ApiClientProvider } from "./api-client-provider";
import { EnvProvider } from "./env-provider";
import { SessionBootstrap } from "./session-bootstrap";
import { SessionProvider } from "./session-provider";

export type AppProvidersProps = {
  children?: ReactNode;
  env?: WebEnv;
  session?: SessionSnapshot;
  apiClients?: ApiClientProviderValue;
};

export const AppProviders = ({ children, env, session, apiClients }: AppProvidersProps) => {
  const envProviderProps = env ? { value: env } : {};
  const sessionProviderProps = session ? { initialSession: session } : {};
  const apiClientProviderProps = apiClients ? { value: apiClients } : {};

  return (
    <EnvProvider {...envProviderProps}>
      <SessionProvider {...sessionProviderProps}>
        <ApiClientProvider {...apiClientProviderProps}>
          <SessionBootstrap />
          {children}
        </ApiClientProvider>
      </SessionProvider>
    </EnvProvider>
  );
};
