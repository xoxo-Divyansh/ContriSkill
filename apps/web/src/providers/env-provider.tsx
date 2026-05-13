"use client";

import React, { createContext, useContext, type ReactNode } from "react";

import { getWebEnv, type WebEnv } from "../env";

const EnvContext = createContext<WebEnv | undefined>(undefined);

export type EnvProviderProps = {
  children: ReactNode;
  value?: WebEnv;
};

export const EnvProvider = ({ children, value }: EnvProviderProps) => {
  const resolvedValue = value ?? getWebEnv();
  return <EnvContext.Provider value={resolvedValue}>{children}</EnvContext.Provider>;
};

export const useEnv = (): WebEnv => {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error("useEnv must be used within EnvProvider.");
  }

  return context;
};
