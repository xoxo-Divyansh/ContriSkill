"use client";

import React, { createContext, useContext, type ReactNode } from "react";

import { designTokens, type DesignTokens } from "../tokens/index.js";

export const themeModes = ["light", "dark"] as const;

export type ThemeMode = (typeof themeModes)[number];

export type ThemeContextValue = {
  mode: ThemeMode;
  tokens: DesignTokens;
};

export const defaultTheme: ThemeContextValue = {
  mode: "light",
  tokens: designTokens
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export type ThemeProviderProps = {
  children: ReactNode;
  value?: Partial<ThemeContextValue>;
};

export const resolveThemeValue = (
  value: Partial<ThemeContextValue> | undefined
): ThemeContextValue => {
  return {
    mode: value?.mode ?? defaultTheme.mode,
    tokens: value?.tokens ?? defaultTheme.tokens
  };
};

export const ThemeProvider = ({ children, value }: ThemeProviderProps) => {
  const resolvedValue = resolveThemeValue(value);
  return <ThemeContext.Provider value={resolvedValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
};
