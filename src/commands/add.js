import { readConfig, writeConfig } from "../lib/config.js";

/**
 * @param {import("commander").Command} program
 */
export function registerAddCommand(program) {
  program
    .command("add")
    .description("Add a dependency to stackit.json")
    .argument("<repoUrl>", "Git repository URL (ssh or https)")
    .requiredOption("--ref <ref>", "Branch, tag, or commit")
    .action(async (repoUrl, opts) => {
      const cwd = process.cwd();
      const config = await readConfig(cwd);
      config.dependencies[repoUrl] = String(opts.ref);
      await writeConfig(cwd, config);
    });
}

