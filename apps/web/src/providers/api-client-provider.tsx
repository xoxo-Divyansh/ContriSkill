"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";

import { createAuthClient, type AuthClient } from "../lib/api/auth-client";
import { createContributionClient, type ContributionClient } from "../lib/api/contribution-client";
import { createDraftClient, type DraftClient } from "../lib/api/draft-client";
import { createHttpClient } from "../lib/api/http-client";
import { createProjectionClient, type ProjectionClient } from "../lib/api/projection-client";
import type { HttpClient } from "../lib/api/types";
import { createUserClient, type UserClient } from "../lib/api/user-client";

import { useEnv } from "./env-provider";

export type ApiClientProviderValue = {
  httpClient: HttpClient;
  authClient: AuthClient;
  contributionClient: ContributionClient;
  draftClient: DraftClient;
  projectionClient: ProjectionClient;
  userClient: UserClient;
};

const ApiClientContext = createContext<ApiClientProviderValue | undefined>(undefined);

export type ApiClientProviderProps = {
  children: ReactNode;
  value?: ApiClientProviderValue;
};

export const ApiClientProvider = ({ children, value }: ApiClientProviderProps) => {
  const env = useEnv();

  const defaultClientValue = useMemo<ApiClientProviderValue>(() => {
    const httpClient = createHttpClient({
      baseUrl: env.apiBaseUrl,
      defaultHeaders: {
        accept: "application/json"
      }
    });

    return {
      httpClient,
      authClient: createAuthClient(httpClient),
      contributionClient: createContributionClient(httpClient),
      draftClient: createDraftClient(httpClient),
      projectionClient: createProjectionClient(httpClient),
      userClient: createUserClient(httpClient)
    };
  }, [env.apiBaseUrl]);

  const contextValue = value ?? defaultClientValue;

  return <ApiClientContext.Provider value={contextValue}>{children}</ApiClientContext.Provider>;
};

export const useApiClient = (): ApiClientProviderValue => {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error("useApiClient must be used within ApiClientProvider.");
  }

  return context;
};
