import { runGit } from "../lib/git.js";

/**
 * @param {import("commander").Command} program
 */
export function registerTagCommand(program) {
  program
    .command("tag")
    .description("Create a git tag in the current repository")
    .argument("<tag>", "Tag name (e.g. 0.0.1)")
    .option("--push", "Also push the tag to origin", false)
    .action(async (tag, opts) => {
      const cwd = process.cwd();
      await runGit(cwd, ["tag", String(tag)]);
      if (opts.push) {
        await runGit(cwd, ["push", "origin", String(tag)]);
      }
    });
}

