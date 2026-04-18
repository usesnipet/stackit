export enum ProjectDependencyErrorType {
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  STATE_NOT_INITIALIZED = "STATE_NOT_INITIALIZED",
  DEPENDENCY_NOT_FOUND = "DEPENDENCY_NOT_FOUND",
  INVALID_URL = "INVALID_URL",
}
export class ProjectDependencyError extends Error {
  code = "PROJECT_DEPENDENCY_ERROR";

  constructor(public readonly type: ProjectDependencyErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ProjectDependencyError";
  }
}

export enum InitProjectDependencyErrorType {
  READ_STACKIT_JSON_FAILED = "READ_STACKIT_JSON_FAILED",
  WRITE_STACKIT_JSON_FAILED = "WRITE_STACKIT_JSON_FAILED",
  STACKIT_ALREADY_INITIALIZED = "STACKIT_ALREADY_INITIALIZED",
  STACKIT_JSON_NOT_FOUND = "STACKIT_JSON_NOT_FOUND",
}
export class InitProjectDependencyError extends Error {
  code = "INIT_PROJECT_DEPENDENCY_ERROR";
  constructor(public readonly type: InitProjectDependencyErrorType, message?: string, cause?: unknown) {
    super(message, { cause });
    this.name = "InitProjectDependencyError";
  }
}

export enum InstallProjectDependencyErrorType {
  STATE_NOT_INITIALIZED = "STATE_NOT_INITIALIZED",
  GLOBAL_DEPENDENCY_NOT_FOUND = "GLOBAL_DEPENDENCY_NOT_FOUND",
  INVALID_REPO_URL = "INVALID_REPO_URL",
  COPY_FAILED = "COPY_FAILED",
  UPDATE_STATE_FAILED = "UPDATE_STATE_FAILED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export class InstallProjectDependencyError extends Error {
  code = "INSTALL_PROJECT_DEPENDENCY_ERROR";
  constructor(public readonly type: InstallProjectDependencyErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "InstallProjectDependencyError";
  }
}

export enum RemoveProjectDependencyErrorType {
  STATE_NOT_INITIALIZED = "STATE_NOT_INITIALIZED",
  DEPENDENCY_NOT_INSTALLED = "DEPENDENCY_NOT_INSTALLED",
  REMOVE_FAILED = "REMOVE_FAILED",
  UPDATE_STATE_FAILED = "UPDATE_STATE_FAILED",
}

export class RemoveProjectDependencyError extends Error {
  code = "REMOVE_PROJECT_DEPENDENCY_ERROR";

  constructor(public readonly type: RemoveProjectDependencyErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "RemoveProjectDependencyError";
  }
}