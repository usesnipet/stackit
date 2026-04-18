import { Result, err, ok } from "neverthrow";
import { GLOBAL_DEPENDENCIES_DIRECTORY, GLOBAL_DEPENDENCIES_JSON_PATH } from "../../constants/index.js";
import { FileService } from "../file/file.service.js";
import { GlobalStackit, globalStackitSchema } from "../../schema/index.js";
import { ReadFileErrorType } from "../file/index.js";
import { GlobalDependencyCheckoutError, GlobalDependencyCheckoutErrorType, GlobalDependencyCloneError, GlobalDependencyCloneErrorType, GlobalDependencyError, GlobalDependencyErrorType, GlobalDependencyInitError, GlobalDependencyInitErrorType } from "./global-dependency.errors.js";
import { simpleGit } from "simple-git";
import { join } from "path";
import { mkdir, readdir } from "fs/promises";

export type GlobalDependencyDeps = {
  fileService: FileService;
}

export const createGlobalDependencyService = (deps: GlobalDependencyDeps) => {
  const { fileService } = deps;
  let state: GlobalStackit | null = null;
  const git = simpleGit();

  async function updateGlobalDependencies(
    dependencies: GlobalStackit,
    persist: boolean = true,
  ): Promise<Result<void, GlobalDependencyError>> {
    state = dependencies;
    if (persist) {
      const fileResult = await fileService.writeJsonFile(GLOBAL_DEPENDENCIES_JSON_PATH, dependencies, globalStackitSchema);
      if (fileResult.isErr()) {
        return err(
          new GlobalDependencyError(
            GlobalDependencyErrorType.WRITE_GLOBAL_DEPENDENCIES_JSON_FAILED,
            "Failed to write global dependencies JSON file",
            fileResult.error
          )
        );
      }
    }
    return ok(undefined);
  }

  async function upsertGlobalDependency(
    url: string,
    branch?: string,
    tag?: string,
    usedIn: string[] = [],
    persist: boolean = true,
  ): Promise<Result<void, GlobalDependencyError>> {
    return updateGlobalDependencies({
      dependencies: {
        ...(state?.dependencies ?? {}),
        [url]: {
          usedIn,
          selectedBranch: branch,
          selectedTag: tag,
        }
      },
    }, persist);
  }

  async function addUsedIn(
    url: string,
    usedIn: string[] | string,
    persist: boolean = true,
  ): Promise<Result<void, GlobalDependencyError>> {
    const dependency = state?.dependencies?.[url];
    if (!dependency) {
      return err(new GlobalDependencyError(GlobalDependencyErrorType.DEPENDENCY_NOT_FOUND, "Dependency not found"));
    }
    const updatedDependencies = {
      ...state?.dependencies,
      [url]: {
        ...dependency,
        usedIn: [...dependency.usedIn, ...(Array.isArray(usedIn) ? usedIn : [usedIn])],
      }
    };
    return updateGlobalDependencies({ dependencies: updatedDependencies }, persist);
  }
  async function updateBranchOrTag(
    url: string,
    branch?: string,
    tag?: string,
    persist: boolean = true,
  ): Promise<Result<void, GlobalDependencyError>> {
    const dependency = state?.dependencies?.[url];
    if (!dependency) {
      return err(new GlobalDependencyError(GlobalDependencyErrorType.DEPENDENCY_NOT_FOUND, "Dependency not found"));
  }
    const updatedDependencies = {
      ...state?.dependencies,
      [url]: {
        ...dependency,
        selectedTag: tag,
        selectedBranch: branch,
      }
    };
    return updateGlobalDependencies({ dependencies: updatedDependencies }, persist);
  }

  const checkout = async (
    repoPath: string,
    branch?: string,
    tag?: string
  ): Promise<Result<void, GlobalDependencyCheckoutError>> => {
    if (!tag && !branch) {
      return err(new GlobalDependencyCheckoutError(GlobalDependencyCheckoutErrorType.TAG_AND_BRANCH_NOT_PROVIDED, "Tag or branch must be provided"));
    }
    if (tag && branch) {
      return err(new GlobalDependencyCheckoutError(GlobalDependencyCheckoutErrorType.TAG_AND_BRANCH_PROVIDED, "Tag and branch cannot be provided together"));
    }
    try {
      const git = simpleGit(repoPath);
      await git.fetch(["--all", "--tags"]);

      if (tag) {
        const tags = await git.tags();

        if (!tags.all.includes(tag)) {
          return err(
            new GlobalDependencyCheckoutError(
              GlobalDependencyCheckoutErrorType.TAG_NOT_FOUND,
              `Tag "${tag}" not found`
            )
          );
        }

        await git.checkout(tag);
        await updateBranchOrTag(repoPath, branch, tag, true);
        return ok(undefined);
      }

      if (branch) {
        const branches = await git.branch(["-a"]);

        const exists =
          branches.all.includes(branch) ||
          branches.all.includes(`remotes/origin/${branch}`);

        if (!exists) {
          return err(
            new GlobalDependencyCheckoutError(
              GlobalDependencyCheckoutErrorType.BRANCH_NOT_FOUND,
              `Branch "${branch}" not found`
            )
          );
        }

        await git.checkout(branch);
        await updateBranchOrTag(repoPath, branch, tag, true);
        return ok(undefined);
      }

    } catch (error: unknown) {
      return err(
        new GlobalDependencyCheckoutError(
          GlobalDependencyCheckoutErrorType.UNEXPECTED_ERROR,
          "Error during checkout",
          error
        )
      );
    }
    return ok(undefined);
  }

  const getRepoPath = (url: string): Result<string, GlobalDependencyError> => {
    try {
      const u = new URL(url);

      const parts = u.pathname.replace(".git", "").split("/").map(part => part.trim()).filter(Boolean);
      const host = u.hostname;
      const paths = parts.slice(1);
      return ok(join(GLOBAL_DEPENDENCIES_DIRECTORY, "deps", host, ...paths));
    } catch {
      return err(new GlobalDependencyError(GlobalDependencyErrorType.INVALID_URL, "Invalid repo URL"));
    }
  }
  return {
    init: async (): Promise<Result<GlobalStackit, GlobalDependencyInitError>> => {
      const fileResult = await fileService.readJsonFile(GLOBAL_DEPENDENCIES_JSON_PATH, globalStackitSchema);
      if (fileResult.isErr()) {
        if (fileResult.error.type === ReadFileErrorType.FILE_NOT_FOUND) {
          const res = await fileService.writeJsonFile(GLOBAL_DEPENDENCIES_JSON_PATH, { dependencies: {} }, globalStackitSchema);
          if (res.isErr()) {
            return err(new GlobalDependencyInitError(GlobalDependencyInitErrorType.UNEXPECTED_ERROR, "Unexpected error writing global dependencies JSON file", res.error));
          }
          state = res.value;
          return ok(state);
        } else {
          return err(new GlobalDependencyInitError(GlobalDependencyInitErrorType.UNEXPECTED_ERROR, "Unexpected error reading global dependencies JSON file", fileResult.error));
        }
      }
      state = fileResult.value;
      return ok(state);
    },
    install: async (
      url: string,
      branch?: string,
      tag?: string,
    ): Promise<Result<string, GlobalDependencyCloneError>> => {
      try {
        if (tag && branch) {
          return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.TAG_AND_BRANCH_PROVIDED, "Tag and branch cannot be provided together"));
        }
        if (!tag && !branch) {
          return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.TAG_AND_BRANCH_NOT_PROVIDED, "Tag or branch must be provided"));
        }
        const repoPathResult = getRepoPath(url);
        if (repoPathResult.isErr()) {
          return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.INVALID_URL, "Invalid repo URL", repoPathResult.error));
        }
        const repoPath = repoPathResult.value;

        await mkdir(repoPath, { recursive: true });

        const files = await readdir(repoPath);
        if (files.length > 0) {
          const checkoutResult = await checkout(repoPath, branch, tag);
          if (checkoutResult.isErr()) {
            switch (checkoutResult.error.type) {
              case GlobalDependencyCheckoutErrorType.TAG_AND_BRANCH_PROVIDED:
                return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.TAG_AND_BRANCH_PROVIDED, "Tag and branch cannot be provided together", checkoutResult.error));
              case GlobalDependencyCheckoutErrorType.TAG_AND_BRANCH_NOT_PROVIDED:
                return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.TAG_AND_BRANCH_NOT_PROVIDED, "Tag or branch must be provided", checkoutResult.error));
              case GlobalDependencyCheckoutErrorType.TAG_NOT_FOUND:
                return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.TAG_NOT_FOUND, "Tag not found", checkoutResult.error));
              case GlobalDependencyCheckoutErrorType.BRANCH_NOT_FOUND:
                return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.BRANCH_NOT_FOUND, "Branch not found", checkoutResult.error));
              case GlobalDependencyCheckoutErrorType.UNEXPECTED_ERROR:
                return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.UNEXPECTED_ERROR, "Unexpected error checking out dependency", checkoutResult.error));
              default:
                return err(new GlobalDependencyCloneError(GlobalDependencyCloneErrorType.UNEXPECTED_ERROR, "Unexpected error checking out dependency", checkoutResult.error));
            }
          }
          return ok(repoPath);
        }
        // clone
        await git.clone(url, repoPath);
        const repoGit = simpleGit(repoPath);

        if (tag) {
          await repoGit.fetch(["--tags"]);
          await repoGit.checkout(tag);
        } else if (branch) {
          await repoGit.checkout(branch);
        }
        await upsertGlobalDependency(url, branch, tag, [], true);
        return ok(repoPath);
      } catch (caught: unknown) {
        return err(
          new GlobalDependencyCloneError(
            GlobalDependencyCloneErrorType.UNEXPECTED_ERROR,
            "Unexpected error cloning dependency",
            caught,
          ),
        );
      }
    },
    checkout,
    addUsedIn,
    getRepoPath,
    getState: () => state,
  }
}

export type GlobalDependencyService = ReturnType<typeof createGlobalDependencyService>;