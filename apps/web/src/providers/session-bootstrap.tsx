"use client";

import { useEffect, useRef } from "react";

import { ApiClientError } from "../lib/api/types";
import { toSessionSnapshot } from "../lib/session/session-mappers";

import { useApiClient } from "./api-client-provider";
import { useSession } from "./session-provider";

export const SessionBootstrap = () => {
  const { authClient } = useApiClient();
  const { session, isReady, setSession, clearSession, setBootstrapIssue, clearBootstrapIssue } =
    useSession();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    const run = async () => {
      try {
        const current = await authClient.getSession(
          session.accessToken ? { accessToken: session.accessToken } : undefined
        );
        setSession(
          toSessionSnapshot(current.actor, {
            ...(session.accessToken ? { accessToken: session.accessToken } : {}),
            ...(session.refreshToken ? { refreshToken: session.refreshToken } : {})
          })
        );
        clearBootstrapIssue();
      } catch (error) {
        if (error instanceof ApiClientError && error.code === "UNAUTHENTICATED") {
          clearSession();
          setBootstrapIssue("Your session expired. Please sign in again.");
          return;
        }

        if (error instanceof ApiClientError && error.kind === "transport") {
          setBootstrapIssue("We could not restore your session because the API is unavailable.");
          return;
        }

        if (error instanceof ApiClientError) {
          setBootstrapIssue(error.message);
          return;
        }

        setBootstrapIssue("Session restore failed. Try refreshing the page.");
      }
    };

    void run();
  }, [
    authClient,
    clearBootstrapIssue,
    clearSession,
    isReady,
    session.accessToken,
    session.refreshToken,
    setBootstrapIssue,
    setSession
  ]);

  return null;
};
