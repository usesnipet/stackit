import type { Command } from "commander";
import { runGit } from "../lib/git.js";
import { log } from "../lib/logger.js";

export function registerTagCommand(program: Command): void {
  program
    .command("tag")
    .description("Create a git tag in the current repository")
    .argument("<tag>", "Tag name (e.g. 0.0.1)")
    .option("--push", "Also push the tag to origin", false)
    .action(async (tag: string, opts: { push?: boolean }) => {
      const cwd = process.cwd();
      log("info", `Creating tag ${tag}...`);
      await runGit(cwd, ["tag", String(tag)]);
      log("info", `Created tag ${tag}.`);
      if (opts.push) {
        log("info", `Pushing tag ${tag} to origin...`);
        await runGit(cwd, ["push", "origin", String(tag)]);
        log("info", "Push complete.");
      }
    });
}

