import { Command } from "commander";
import { StackitService } from "../core/services/stackit/index.js";
import { createInitCommand } from "./init.js";
import { createInstallCommand } from "./install.js";

type CreateCommandsDeps = {
  program: Command;
  stackitService: StackitService;
};
export function createCommands(deps: CreateCommandsDeps) {
  const { program, stackitService } = deps;
  createInitCommand({ program, stackitService });
  createInstallCommand({ program, stackitService });
}