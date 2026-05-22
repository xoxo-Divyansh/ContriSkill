import "../styles/globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "../providers/app-providers";

export const metadata: Metadata = {
  title: "ContriSkill",
  description: "A collaborative platform for contribution-driven work and shared trust signals."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
