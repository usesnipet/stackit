import type { Command } from "commander";
import path from "node:path";
import { readConfig } from "../lib/config.js";
import { ensureDependency } from "../lib/dependency.js";
import { log } from "../lib/logger.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install")
    .description("Install dependencies defined in stackit.json")
    .action(async () => {
      const cwd = process.cwd();
      const config = await readConfig(cwd);
      const vendorDir = path.join(cwd, config.dir);
      const entries = Object.entries(config.dependencies);

      log("info", `Installing ${entries.length} dependenc${entries.length === 1 ? "y" : "ies"}...`);
      log("info", `Target directory: ${vendorDir}`);

      for (const [repoUrl, ref] of entries) {
        log("info", `Installing ${repoUrl} @ ${ref}`);
        await ensureDependency(vendorDir, repoUrl, ref);
        log("info", `Done: ${repoUrl}`);
      }

      log("info", "Install complete.");
    });
}

