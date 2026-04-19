import { Command } from "commander";
import { createCommands } from "./commands/index.js";
import { createDefaultStackit } from "./core/bootstrap-stackit.js";
import { version } from "./utils/index.js";

export async function createProgram(): Promise<Command> {
  const program = new Command();
  program.name("stackit").description("Git-native dependency manager.").version(version);

  createCommands({ program, stackitService: await createDefaultStackit() });
  return program;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const program = await createProgram();
  await program.parseAsync(argv);
}

