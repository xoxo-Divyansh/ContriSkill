import { execSync } from "node:child_process";

try {
  execSync("git config core.hooksPath .githooks", { stdio: "inherit" });
} catch {
  // Hook installation is best-effort for local dev bootstrap.
}
