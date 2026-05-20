"use client";

import type { ReactNode } from "react";

import { RequireAuth } from "../../lib/routing/require-auth";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
