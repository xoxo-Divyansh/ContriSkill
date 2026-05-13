import type { ReactNode } from "react";

import { RequireAuth } from "../../lib/routing/require-auth";

export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <section>
        <header>
          <h2>Protected App Shell</h2>
        </header>
        {children}
      </section>
    </RequireAuth>
  );
}
