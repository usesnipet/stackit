import type { Command } from "commander";
import { readConfig, writeConfig } from "../lib/config.js";
import { log } from "../lib/logger.js";
import { ensureDependency } from "../lib/dependency.js";
import path from "node:path";

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Add a dependency to stackit.json")
    .argument("<repoUrl>", "Git repository URL (ssh or https)")
    .requiredOption("--ref <ref>", "Branch, tag, or commit")
    .action(async (repoUrl: string, opts: { ref: string }) => {
      const cwd = process.cwd();
      const config = await readConfig(cwd);
      const existed = Object.prototype.hasOwnProperty.call(config.dependencies, repoUrl);
      config.dependencies[repoUrl] = String(opts.ref);
      log("info", `${existed ? "Updating" : "Adding"} dependency: ${repoUrl} @ ${opts.ref}`);
      await writeConfig(cwd, config);
      log("info", "Saved stackit.json");
      const vendorDir = path.join(cwd, config.dir);
      await ensureDependency(vendorDir, repoUrl, opts.ref);
      log("info", "Dependency added successfully");
    });
}

