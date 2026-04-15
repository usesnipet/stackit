import type { Command } from "commander";
import path from "node:path";
import { CONFIG_FILENAME, pathExists, writeConfig } from "../lib/config.js";
import { log } from "../lib/logger.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create a stackit.json template in the current directory")
    .action(async () => {
      const cwd = process.cwd();
      const p = path.join(cwd, CONFIG_FILENAME);
      if (await pathExists(p)) {
        throw new Error(`${CONFIG_FILENAME} already exists`);
      }
      log("info", `Creating ${CONFIG_FILENAME}...`);
      await writeConfig(cwd, { dir: "vendor", dependencies: {} });
      log("info", `Created ${p}`);
    });
}

