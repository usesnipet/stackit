import { cp, rm } from "fs/promises";
import { Result, err, ok } from "neverthrow";
import {
  InitProjectDependencyError,
  InitProjectDependencyErrorType,
  InstallProjectDependencyError,
  InstallProjectDependencyErrorType,
  ProjectDependencyError,
  ProjectDependencyErrorType,
  RemoveProjectDependencyError,
  RemoveProjectDependencyErrorType,
} from "./project-dependency.errors.js";
import { FileService } from "../file/file.service.js";
import { ProjectStackit, projectStackitSchema } from "../../schema/index.js";
import { PROJECT_JSON_NAME, PROJECT_JSON_PATH } from "../../constants/index.js";
import { ReadFileErrorType } from "../file/index.js";
import { GlobalDependencyService } from "../global-dependency/index.js";
import { ensureDir, existsDir } from "../../../utils/ensure-dir.js";
import { join } from "path";
import { currentDir } from "../../../utils/current-dir.js";

export type ProjectDependencyDeps = {
  fileService: FileService;
  projectDir: string;
  globalDependencyService: GlobalDependencyService;
}

export const createProjectDependencyService = (deps: ProjectDependencyDeps) => {
  const { fileService, projectDir, globalDependencyService } = deps;

  let state: ProjectStackit | null = null;
  const getStackitProjectJson = async (dir: string) => {
    const stackitJsonPath = join(dir, PROJECT_JSON_NAME);
    return fileService.readJsonFile(stackitJsonPath, projectStackitSchema);
  }

  const writeStackitProjectJson = async (dir: string, projectStackit: ProjectStackit) => {
    const stackitJsonPath = join(dir, PROJECT_JSON_NAME);
    return fileService.writeJsonFile(stackitJsonPath, projectStackit, projectStackitSchema);
  }
  async function updateState(updatedState: ProjectStackit): Promise<Result<ProjectStackit, ProjectDependencyError>> {
    state = updatedState;
    const fileResult = await fileService.writeJsonFile(PROJECT_JSON_PATH(projectDir), state, projectStackitSchema);
    if (fileResult.isErr()) {
      return err(new ProjectDependencyError(ProjectDependencyErrorType.UNEXPECTED_ERROR, "Unexpected error writing project dependencies JSON file", fileResult.error));
    }
    return ok(state);
  }

  const init = async (
    dependenciesDirectory: string,
    createIfNotFound: boolean = false
  ): Promise<Result<ProjectStackit | null, InitProjectDependencyError>> => {
    const getResult = await getStackitProjectJson(currentDir());
    if (getResult.isErr() && getResult.error.type !== ReadFileErrorType.FILE_NOT_FOUND) {
      return err(new InitProjectDependencyError(InitProjectDependencyErrorType.READ_STACKIT_JSON_FAILED, undefined, getResult.error));
    }
    if (getResult.isOk()) {
      state = getResult.value;
      return ok(state);
    }
    if (!createIfNotFound) {
      return ok(null);
    }
    const writeResult = await writeStackitProjectJson(
      currentDir(),
      { dependencies: {}, dir: dependenciesDirectory }
    );
    if (writeResult.isErr()) return err(new InitProjectDependencyError(InitProjectDependencyErrorType.WRITE_STACKIT_JSON_FAILED, undefined, writeResult.error));
    state = writeResult.value;
    return ok(state);
  }

  const getRepoPath = (state: ProjectStackit, url: string): Result<string, ProjectDependencyError> => {
    try {
      const u = new URL(url);

      const parts = u.pathname.replace(".git", "").split("/").map(part => part.trim()).filter(Boolean);
      const host = u.hostname;
      const paths = parts.slice(1);
      return ok(join(state.dir, "deps", host, ...paths));
    } catch {
      return err(new ProjectDependencyError(ProjectDependencyErrorType.INVALID_URL, "Invalid repo URL"));
    }
  }

  const install = async (
    url: string
  ): Promise<Result<void, InstallProjectDependencyError>> => {
    if (!state) {
      return err(new InstallProjectDependencyError(InstallProjectDependencyErrorType.STATE_NOT_INITIALIZED, "State not initialized"));
    }
    const globalDependencyPathResult = globalDependencyService.getRepoPath(url);
    if (globalDependencyPathResult.isErr()) {
      return err(new InstallProjectDependencyError(InstallProjectDependencyErrorType.GLOBAL_DEPENDENCY_NOT_FOUND, "Global dependency not found", globalDependencyPathResult.error));
    }
    const globalDependencyPath = globalDependencyPathResult.value;
    const globalDependency = await existsDir(globalDependencyPath);
    if (!globalDependency) {
      return err(new InstallProjectDependencyError(InstallProjectDependencyErrorType.GLOBAL_DEPENDENCY_NOT_FOUND, "Global dependency not found"));
    }
    const projectDependencyPathResult = getRepoPath(state, url);
    if (projectDependencyPathResult.isErr()) {
      return err(new InstallProjectDependencyError(InstallProjectDependencyErrorType.INVALID_REPO_URL, "Invalid repo URL", projectDependencyPathResult.error));
    }
    const projectDependencyPath = projectDependencyPathResult.value;
    await ensureDir(projectDependencyPath);
    try {
      await cp(globalDependencyPath, projectDependencyPath, {
        recursive: true,
        filter: (source, _destination) => !source.includes(".git")
      });
    } catch (error) {
      return err(new InstallProjectDependencyError(InstallProjectDependencyErrorType.COPY_FAILED, "Failed to copy global dependency", error));
    }
    const updatedState = {
      ...state,
      dependencies: {
        ...state.dependencies,
        [url]: projectDependencyPath,
      },
    };
    const updateResult = await updateState(updatedState);
    if (updateResult.isErr()) {
      return err(new InstallProjectDependencyError(InstallProjectDependencyErrorType.UPDATE_STATE_FAILED, "Failed to update project dependencies state", updateResult.error));
    }
    return ok(undefined);
  }

  const remove = async (url: string): Promise<Result<void, RemoveProjectDependencyError>> => {
    if (!state) {
      return err(
        new RemoveProjectDependencyError(RemoveProjectDependencyErrorType.STATE_NOT_INITIALIZED, "State not initialized"),
      );
    }
    const projectDependencyPath = state.dependencies[url];
    if (projectDependencyPath === undefined) {
      return err(
        new RemoveProjectDependencyError(
          RemoveProjectDependencyErrorType.DEPENDENCY_NOT_INSTALLED,
          "Dependency is not installed in this project",
        ),
      );
    }
    try {
      await rm(projectDependencyPath, { recursive: true, force: true });
    } catch (error) {
      return err(
        new RemoveProjectDependencyError(RemoveProjectDependencyErrorType.REMOVE_FAILED, "Failed to remove dependency from disk", error),
      );
    }
    const restDependencies = { ...state.dependencies };
    delete restDependencies[url];
    const updateResult = await updateState({ ...state, dependencies: restDependencies });
    if (updateResult.isErr()) {
      return err(
        new RemoveProjectDependencyError(
          RemoveProjectDependencyErrorType.UPDATE_STATE_FAILED,
          "Failed to update project dependencies state",
          updateResult.error,
        ),
      );
    }
    return ok(undefined);
  };

  const updateDependencyVersion = async (url: string, tag: string): Promise<Result<void, ProjectDependencyError>> => {
    if (!state) {
      return err(new ProjectDependencyError(ProjectDependencyErrorType.UNEXPECTED_ERROR, "State not initialized"));
    }
    const dependency = state.dependencies[url];
    if (!dependency) {
      return err(new ProjectDependencyError(ProjectDependencyErrorType.DEPENDENCY_NOT_FOUND, "Dependency not found"));
    }
    const updatedState: ProjectStackit = {
      ...state,
      dependencies: { ...state.dependencies, [url]: tag },
    };
    const writeResult = await updateState(updatedState);
    if (writeResult.isErr()) return err(writeResult.error);
    return ok(undefined);
  };

  return {
    init,
    install,
    remove,
    updateDependencyVersion,
    getState: () => state,
    getRepoPath: (url: string) => {
      if (!state) return err(new ProjectDependencyError(ProjectDependencyErrorType.STATE_NOT_INITIALIZED, "State not initialized"));
      return getRepoPath(state, url);
    },
  }
}

export type ProjectDependencyService = ReturnType<typeof createProjectDependencyService>;