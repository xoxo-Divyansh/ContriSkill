import { getWebEnv } from "../env";

const webEnv = getWebEnv();

export default function HomePage() {
  return (
    <main>
      <h1>{webEnv.appName} Engineering Foundation</h1>
      <p>Frontend bootstrap is initialized. Product features are intentionally not implemented.</p>
    </main>
  );
}
