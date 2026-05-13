import { getWebEnv } from "../../../env";

const webEnv = getWebEnv();

export default function PublicHomePage() {
  return (
    <main>
      <h1>{webEnv.appName} Public Landing</h1>
      <p>Public route-group shell is active. Feature pages are intentionally deferred.</p>
    </main>
  );
}
