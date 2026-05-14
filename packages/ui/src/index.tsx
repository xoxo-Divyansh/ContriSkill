import type { ReactNode } from "react";

export * from "./providers/theme-provider.js";
export * from "./tokens/index.js";

type FoundationShellProps = {
  title: string;
  children?: ReactNode;
};

export const FoundationShell = ({ title, children }: FoundationShellProps) => {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
};
