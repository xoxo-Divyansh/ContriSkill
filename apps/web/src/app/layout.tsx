import "../styles/globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "../providers/app-providers";

export const metadata: Metadata = {
  title: "ContriSkill Foundation",
  description: "MVP engineering foundation bootstrap"
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
