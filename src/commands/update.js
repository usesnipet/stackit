import path from "node:path";
import { readConfig } from "../lib/config.js";
import { ensureDependency } from "../lib/dependency.js";

/**
 * @param {import("commander").Command} program
 */
export function registerUpdateCommand(program) {
  program
    .command("update")
    .description("Fetch and re-checkout dependencies (alias of install)")
    .action(async () => {
      const cwd = process.cwd();
      const config = await readConfig(cwd);
      const vendorDir = path.join(cwd, config.dir);
      const entries = Object.entries(config.dependencies);

      for (const [repoUrl, ref] of entries) {
        // eslint-disable-next-line no-console
        console.log(`• ${repoUrl} @ ${ref}`);
        await ensureDependency(vendorDir, repoUrl, ref);
      }
    });
}

