import type { ReactNode } from "react";

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
