import { Command } from "commander";

import {
  registerAddCommand,
  registerInitCommand,
  registerInstallCommand,
  registerTagCommand,
  registerUpdateCommand,
} from "./commands/index.js";

export const version = "0.1.0";

/**
 * @returns {Command}
 */
export function createProgram() {
  const program = new Command();
  program.name("stackit").description("Git-native dependency manager.").version(version);

  registerInitCommand(program);
  registerInstallCommand(program);
  registerUpdateCommand(program);
  registerAddCommand(program);
  registerTagCommand(program);

  return program;
}

/**
 * @param {string[]} argv
 */
export async function main(argv = process.argv) {
  const program = createProgram();
  await program.parseAsync(argv);
}

export { repoUrlToFolderName } from "./lib/dependency.js";

