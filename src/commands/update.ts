import type { Command } from "commander";
import path from "node:path";
import { readConfig } from "../lib/config.js";
import { ensureDependency } from "../lib/dependency.js";
import { log } from "../lib/logger.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Fetch and re-checkout dependencies (alias of install)")
    .action(async () => {
      const cwd = process.cwd();
      const config = await readConfig(cwd);
      const vendorDir = path.join(cwd, config.dir);
      const entries = Object.entries(config.dependencies);

      log("info", `Updating ${entries.length} dependenc${entries.length === 1 ? "y" : "ies"}...`);
      log("info", `Target directory: ${vendorDir}`);

      for (const [repoUrl, ref] of entries) {
        log("info", `Updating ${repoUrl} @ ${ref}`);
        await ensureDependency(vendorDir, repoUrl, ref);
        log("info", `Done: ${repoUrl}`);
      }

      log("info", "Update complete.");
    });
}

