import { resolve } from "node:path";
import { Result, err, ok } from "neverthrow";
import { InstallError, InstallErrorType, RemoveError, RemoveErrorType } from "./stackit.errors.js";
import { GlobalDependencyCloneErrorType, GlobalDependencyErrorType, GlobalDependencyService } from "../global-dependency/index.js";
import { ProjectDependencyService } from "../project-dependency/project-dependency.service.js";
import { RemoveProjectDependencyErrorType } from "../project-dependency/project-dependency.errors.js";
import { currentDir } from "../../../utils/current-dir.js";

type StackitServiceDeps = {
  globalDependencyService: GlobalDependencyService;
  projectDependencyService: ProjectDependencyService;
};

export const createStackitService = (deps: StackitServiceDeps) => {
  const { globalDependencyService, projectDependencyService } = deps;

  const projectRootPath = () => resolve(currentDir());

  return {
    init: projectDependencyService.init,
    remove: async (dependencyUrl: string): Promise<Result<void, RemoveError>> => {
      const removeResult = await projectDependencyService.remove(dependencyUrl);
      if (removeResult.isErr()) {
        switch (removeResult.error.type) {
          case RemoveProjectDependencyErrorType.STATE_NOT_INITIALIZED:
            return err(new RemoveError(RemoveErrorType.STATE_NOT_INITIALIZED, removeResult.error.message, removeResult.error));
          case RemoveProjectDependencyErrorType.DEPENDENCY_NOT_INSTALLED:
            return err(new RemoveError(RemoveErrorType.DEPENDENCY_NOT_INSTALLED, removeResult.error.message, removeResult.error));
          case RemoveProjectDependencyErrorType.REMOVE_FAILED:
            return err(new RemoveError(RemoveErrorType.REMOVE_FAILED, removeResult.error.message, removeResult.error));
          case RemoveProjectDependencyErrorType.UPDATE_STATE_FAILED:
            return err(new RemoveError(RemoveErrorType.UPDATE_STATE_FAILED, removeResult.error.message, removeResult.error));
          default:
            return err(new RemoveError(RemoveErrorType.REMOVE_FAILED, removeResult.error.message, removeResult.error));
        }
      }
      const globalRemoveResult = await globalDependencyService.removeUsedIn(dependencyUrl, projectRootPath());
      if (globalRemoveResult.isErr()) {
        switch (globalRemoveResult.error.type) {
          case GlobalDependencyErrorType.WRITE_GLOBAL_DEPENDENCIES_JSON_FAILED:
            return err(
              new RemoveError(RemoveErrorType.UPDATE_GLOBAL_USED_IN_FAILED, globalRemoveResult.error.message, globalRemoveResult.error),
            );
          default:
            return err(
              new RemoveError(RemoveErrorType.UPDATE_GLOBAL_USED_IN_FAILED, globalRemoveResult.error.message, globalRemoveResult.error),
            );
        }
      }
      return ok(undefined);
    },
    install: async (
      dependencyUrl: string,
      branch?: string,
      tag?: string,
    ): Promise<Result<void, InstallError>> => {
      const state = projectDependencyService.getState();
      if (!state) return err(new InstallError(InstallErrorType.STATE_NOT_INITIALIZED, "State not initialized"));

      const globalInstallResult = await globalDependencyService.install(dependencyUrl, branch, tag);
      if (globalInstallResult.isErr()) {
        switch (globalInstallResult.error.type) {
          case GlobalDependencyCloneErrorType.INVALID_URL:
            return err(new InstallError(InstallErrorType.CLONE_DEPENDENCY_ERROR, "Invalid URL", globalInstallResult.error));
          case GlobalDependencyCloneErrorType.TAG_AND_BRANCH_PROVIDED:
            return err(new InstallError(InstallErrorType.CLONE_DEPENDENCY_ERROR, "Tag and branch cannot be provided together", globalInstallResult.error));
          case GlobalDependencyCloneErrorType.TAG_AND_BRANCH_NOT_PROVIDED:
            return err(new InstallError(InstallErrorType.CLONE_DEPENDENCY_ERROR, "Tag or branch must be provided", globalInstallResult.error));
          case GlobalDependencyCloneErrorType.TAG_NOT_FOUND:
            return err(new InstallError(InstallErrorType.CLONE_DEPENDENCY_ERROR, "Tag not found", globalInstallResult.error));
          case GlobalDependencyCloneErrorType.BRANCH_NOT_FOUND:
            return err(new InstallError(InstallErrorType.CLONE_DEPENDENCY_ERROR, "Branch not found", globalInstallResult.error));
          default:
            return err(new InstallError(InstallErrorType.CLONE_DEPENDENCY_ERROR, "Unexpected error cloning dependency", globalInstallResult.error));
        }
      }
      const projectInstallResult = await projectDependencyService.install(dependencyUrl);
      if (projectInstallResult.isErr()) {
        return err(
          new InstallError(InstallErrorType.UNEXPECTED_ERROR, "Failed to copy global dependency", projectInstallResult.error),
        );
      }
      const addUsedResult = await globalDependencyService.addUsedIn(dependencyUrl, projectRootPath());
      if (addUsedResult.isErr()) {
        switch (addUsedResult.error.type) {
          case GlobalDependencyErrorType.DEPENDENCY_NOT_FOUND:
            return err(new InstallError(InstallErrorType.UPDATE_GLOBAL_USED_IN_FAILED, addUsedResult.error.message, addUsedResult.error));
          case GlobalDependencyErrorType.WRITE_GLOBAL_DEPENDENCIES_JSON_FAILED:
            return err(new InstallError(InstallErrorType.UPDATE_GLOBAL_USED_IN_FAILED, addUsedResult.error.message, addUsedResult.error));
          default:
            return err(new InstallError(InstallErrorType.UPDATE_GLOBAL_USED_IN_FAILED, addUsedResult.error.message, addUsedResult.error));
        }
      }
      return ok(undefined);
    },
  }
}