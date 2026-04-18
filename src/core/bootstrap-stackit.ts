import { resolve } from "node:path";
import { createFileService } from "./services/file/file.service.js";
import { createGlobalDependencyService } from "./services/global-dependency/global-dependency.service.js";
import { createProjectDependencyService } from "./services/project-dependency/project-dependency.service.js";
import { createStackitService } from "./services/stackit/stackit.service.js";
import { currentDir } from "../utils/current-dir.js";
import { err, ok } from "neverthrow";

/**
 * Wires the default file, global dependency, project dependency, and stackit services for the CLI.
 * @returns Service instances scoped to the current working directory
 */
export async function createDefaultStackit() {
  const fileService = createFileService();
  const globalDependencyService = createGlobalDependencyService({ fileService });
  const globalInitResult = await globalDependencyService.init();
  if (globalInitResult.isErr()) return err(globalInitResult.error);

  const projectDir = resolve(currentDir());
  const projectDependencyService = createProjectDependencyService({
    fileService,
    projectDir,
    globalDependencyService,
  });
  const projectInitResult = await projectDependencyService.init(projectDir);
  if (projectInitResult.isErr()) return err(projectInitResult.error);

  const stackitService = createStackitService({
    globalDependencyService,
    projectDependencyService,
  });
  return ok({ fileService, globalDependencyService, projectDependencyService, stackitService });
}
