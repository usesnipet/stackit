import { Result, err, ok } from "neverthrow";
import { InstallError, InstallErrorType } from "./stackit.errors.js";
import { GlobalDependencyCloneErrorType, GlobalDependencyService } from "../global-dependency/index.js";
import { ProjectDependencyService } from "../project-dependency/project-dependency.service.js";

type StackitServiceDeps = {
  globalDependencyService: GlobalDependencyService;
  projectDependencyService: ProjectDependencyService;
};

export const createStackitService = (deps: StackitServiceDeps) => {
  const { globalDependencyService, projectDependencyService } = deps;

  return {
    init: projectDependencyService.init,
    install: async (
      dependencyUrl: string,
      branch?: string,
      tag?: string,
    ): Promise<Result<void, InstallError>> => {
      const state = projectDependencyService.getState();
      if (!state) return err(new InstallError(InstallErrorType.STATE_NOT_INITIALIZED, "State not initialized"));

      if (state.dependencies[dependencyUrl]) return err(new InstallError(InstallErrorType.DEPENDENCY_ALREADY_INSTALLED, "Dependency already installed"));

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
      return ok(undefined);
    },
  }
}