import { RedirectIfAuth } from "../../../lib/routing/redirect-if-auth";

export default function SignInPage() {
  return (
    <RedirectIfAuth>
      <main>
        <h1>Sign-in Route Shell</h1>
        <p>Authentication UI is intentionally deferred to a later sprint.</p>
      </main>
    </RedirectIfAuth>
  );
}
