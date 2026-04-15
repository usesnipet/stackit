import path from "node:path";
import { CONFIG_FILENAME, pathExists, writeConfig } from "../lib/config.js";

/**
 * @param {import("commander").Command} program
 */
export function registerInitCommand(program) {
  program
    .command("init")
    .description("Create a stackit.json template in the current directory")
    .action(async () => {
      const cwd = process.cwd();
      const p = path.join(cwd, CONFIG_FILENAME);
      if (await pathExists(p)) {
        throw new Error(`${CONFIG_FILENAME} already exists`);
      }
      await writeConfig(cwd, { dir: "vendor", dependencies: {} });
    });
}

