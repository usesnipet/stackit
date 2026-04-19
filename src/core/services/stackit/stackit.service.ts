import { resolve } from "node:path";
import { Result, err, ok } from "neverthrow";
import {
  InstallError,
  InstallErrorType,
  ReleaseError,
  ReleaseErrorType,
  RemoveError,
  RemoveErrorType,
} from "./stackit.errors.js";
import { GlobalDependencyCloneErrorType, GlobalDependencyErrorType, GlobalDependencyService } from "../global-dependency/index.js";
import {
  GlobalDependencyReleaseError,
  GlobalDependencyReleaseErrorType,
} from "../global-dependency/global-dependency.errors.js";
import { ProjectDependencyService } from "../project-dependency/project-dependency.service.js";
import { RemoveProjectDependencyErrorType } from "../project-dependency/project-dependency.errors.js";
import { currentDir } from "../../../utils/current-dir.js";
import { resolveReleaseTag, type SemverBump } from "../../../utils/resolve-release-tag.js";

export type ReleaseOptions = {
  tag?: string;
  message?: string;
  bump?: SemverBump;
  push?: boolean;
};

function mapGlobalReleaseError(cause: GlobalDependencyReleaseError): ReleaseError {
  switch (cause.type) {
    case GlobalDependencyReleaseErrorType.VENDOR_NOT_FOUND:
      return new ReleaseError(ReleaseErrorType.DEPENDENCY_NOT_INSTALLED, cause.message, cause);
    case GlobalDependencyReleaseErrorType.GLOBAL_REPO_NOT_FOUND:
    case GlobalDependencyReleaseErrorType.NOT_A_GIT_REPO:
      return new ReleaseError(ReleaseErrorType.GLOBAL_REPO_MISSING, cause.message, cause);
    case GlobalDependencyReleaseErrorType.LIST_TAGS_FAILED:
      return new ReleaseError(ReleaseErrorType.PROMOTE_FAILED, cause.message, cause);
    default:
      return new ReleaseError(ReleaseErrorType.PROMOTE_FAILED, cause.message, cause);
  }
}

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

    release: async (
      dependencyUrl: string,
      options: ReleaseOptions,
    ): Promise<Result<{ tag: string }, ReleaseError>> => {
      const projectVendorPathResult = projectDependencyService.getRepoPath(dependencyUrl);
      if (projectVendorPathResult.isErr()) {
        return err(new ReleaseError(ReleaseErrorType.STATE_NOT_INITIALIZED, "State not initialized"));
      }
      const projectVendorPath = projectVendorPathResult.value;
      if (projectVendorPath === undefined) {
        return err(
          new ReleaseError(ReleaseErrorType.DEPENDENCY_NOT_INSTALLED, "Dependency is not installed in this project"),
        );
      }
      const globalPathResult = globalDependencyService.getRepoPath(dependencyUrl);
      if (globalPathResult.isErr()) {
        return err(
          new ReleaseError(ReleaseErrorType.GLOBAL_REPO_MISSING, globalPathResult.error.message, globalPathResult.error),
        );
      }
      const globalRepoPath = globalPathResult.value;
      const tagsResult = await globalDependencyService.listGitTags(globalRepoPath);
      if (tagsResult.isErr()) {
        return err(mapGlobalReleaseError(tagsResult.error));
      }
      const tagResolved = resolveReleaseTag({
        explicitTag: options.tag,
        bump: options.bump,
        existingTags: tagsResult.value,
      });
      if (tagResolved.isErr()) {
        return err(new ReleaseError(ReleaseErrorType.TAG_RESOLUTION_FAILED, tagResolved.error));
      }
      const tag = tagResolved.value;
      const commitMessage = (options.message?.trim() || tag).trim();
      const promoteResult = await globalDependencyService.promoteVendorToGlobalRepo({
        globalRepoPath,
        vendorPath: projectVendorPath,
        tag,
        commitMessage,
        push: Boolean(options.push),
      });
      if (promoteResult.isErr()) {
        return err(mapGlobalReleaseError(promoteResult.error));
      }
      const refResult = await globalDependencyService.setDependencyRef(dependencyUrl, undefined, tag);
      if (refResult.isErr()) {
        return err(new ReleaseError(ReleaseErrorType.UPDATE_GLOBAL_REF_FAILED, refResult.error.message, refResult.error));
      }
      const updateDependencyVersionResult = await projectDependencyService.updateDependencyVersion(dependencyUrl, tag);
      if (updateDependencyVersionResult.isErr()) {
        return err(new ReleaseError(ReleaseErrorType.UPDATE_PROJECT_RELEASES_FAILED, updateDependencyVersionResult.error.message, updateDependencyVersionResult.error));
      }
      return ok({ tag });
    },
  }
}

export type StackitService = ReturnType<typeof createStackitService>;