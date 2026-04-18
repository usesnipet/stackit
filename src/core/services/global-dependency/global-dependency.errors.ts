export enum GlobalDependencyErrorType {
  WRITE_GLOBAL_DEPENDENCIES_JSON_FAILED = "WRITE_GLOBAL_DEPENDENCIES_JSON_FAILED",
  DEPENDENCY_NOT_FOUND = "DEPENDENCY_NOT_FOUND",
  INVALID_URL = "INVALID_URL",
}
export class GlobalDependencyError extends Error {
  code = "GLOBAL_DEPENDENCY_ERROR";
  constructor(public readonly type: GlobalDependencyErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GlobalDependencyError";
  }
}

export enum GlobalDependencyInitErrorType {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INVALID_JSON = "INVALID_JSON",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}
export class GlobalDependencyInitError extends Error {
  code = "GLOBAL_DEPENDENCY_INIT_ERROR";
  constructor(public readonly type: GlobalDependencyInitErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GlobalDependencyInitError";
  }
}

export enum GlobalDependencyCloneErrorType {
  TAG_AND_BRANCH_PROVIDED = "TAG_AND_BRANCH_PROVIDED",
  TAG_AND_BRANCH_NOT_PROVIDED = "TAG_AND_BRANCH_NOT_PROVIDED",
  REPO_ALREADY_EXISTS = "REPO_ALREADY_EXISTS",
  INVALID_URL = "INVALID_URL",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  TAG_NOT_FOUND = "TAG_NOT_FOUND",
  BRANCH_NOT_FOUND = "BRANCH_NOT_FOUND",
}
export class GlobalDependencyCloneError extends Error {
  code = "GLOBAL_DEPENDENCY_CLONE_ERROR";
  constructor(public readonly type: GlobalDependencyCloneErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GlobalDependencyCloneError";
  }
}

export enum GlobalDependencyCheckoutErrorType {
  TAG_AND_BRANCH_PROVIDED = "TAG_AND_BRANCH_PROVIDED",
  TAG_AND_BRANCH_NOT_PROVIDED = "TAG_AND_BRANCH_NOT_PROVIDED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  TAG_NOT_FOUND = "TAG_NOT_FOUND",
  BRANCH_NOT_FOUND = "BRANCH_NOT_FOUND",
}
export class GlobalDependencyCheckoutError extends Error {
  code = "GLOBAL_DEPENDENCY_CHECKOUT_ERROR";
  constructor(public readonly type: GlobalDependencyCheckoutErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GlobalDependencyCheckoutError";
  }
}

export enum GlobalDependencyReleaseErrorType {
  NOT_A_GIT_REPO = "NOT_A_GIT_REPO",
  GLOBAL_REPO_NOT_FOUND = "GLOBAL_REPO_NOT_FOUND",
  VENDOR_NOT_FOUND = "VENDOR_NOT_FOUND",
  WORKTREE_CLEAR_FAILED = "WORKTREE_CLEAR_FAILED",
  COPY_FAILED = "COPY_FAILED",
  NO_CHANGES = "NO_CHANGES",
  COMMIT_FAILED = "COMMIT_FAILED",
  TAG_EXISTS = "TAG_EXISTS",
  TAG_FAILED = "TAG_FAILED",
  LIST_TAGS_FAILED = "LIST_TAGS_FAILED",
  PUSH_FAILED = "PUSH_FAILED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export class GlobalDependencyReleaseError extends Error {
  code = "GLOBAL_DEPENDENCY_RELEASE_ERROR";

  constructor(public readonly type: GlobalDependencyReleaseErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GlobalDependencyReleaseError";
  }
}