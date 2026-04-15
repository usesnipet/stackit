import { Command } from "commander";
import { readFileSync } from "node:fs";

import {
  registerAddCommand,
  registerInitCommand,
  registerInstallCommand,
  registerTagCommand,
  registerUpdateCommand,
} from "./commands/index.js";

export const logo = `
  ___ _____ _   ___ _  _____ _____
 / __|_   _/_\\ / __| |/ /_ _|_   _|
 \\__ \\ | |/ _ \\ (__| ' < | |  | |
 |___/ |_/_/ \\_\\___|_|\\_\\___| |_|  `;

function readPackageVersion(): string {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const raw = readFileSync(pkgUrl, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      const v = (parsed as any).version;
      if (typeof v === "string" && v.trim()) return v;
    }
  } catch {
    // ignore
  }
  return "0.0.0";
}

export const version = readPackageVersion();

export function createProgram(): Command {
  const program = new Command();
  program.name("stackit").description("Git-native dependency manager.").version(version);

  registerInitCommand(program);
  registerInstallCommand(program);
  registerUpdateCommand(program);
  registerAddCommand(program);
  registerTagCommand(program);

  return program;
}

export async function main(argv: string[] = process.argv): Promise<void> {
  if (!process.env.STACKIT_NO_LOGO) {
    // eslint-disable-next-line no-console
    console.log(logo);
  }
  const program = createProgram();
  await program.parseAsync(argv);
}

export { repoUrlToFolderName } from "./lib/dependency.js";

