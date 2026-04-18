export class StackitError extends Error {
  code = "STACKIT_ERROR";

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "StackitError";
  }
}

export enum InitErrorType {
  READ_STACKIT_JSON = "READ_STACKIT_JSON",
  STACKIT_JSON_INVALID = "STACKIT_JSON_INVALID",
  STACKIT_ALREADY_INITIALIZED = "STACKIT_ALREADY_INITIALIZED",
  WRITE_STACKIT_JSON = "WRITE_STACKIT_JSON",
}
export class InitError extends StackitError {
  override code = "INIT_ERROR";

  constructor(
    public readonly type: InitErrorType,
    message: string = "Error initializing stackit",
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "InitError";
  }
}

export enum InstallErrorType {
  READ_STACKIT_JSON = "READ_STACKIT_JSON",
  STACKIT_JSON_INVALID = "STACKIT_JSON_INVALID",
  WRITE_STACKIT_JSON = "WRITE_STACKIT_JSON",
  DEPENDENCY_NOT_FOUND = "DEPENDENCY_NOT_FOUND",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  CLONE_DEPENDENCY_ERROR = "CLONE_DEPENDENCY_ERROR",
  STATE_NOT_INITIALIZED = "STATE_NOT_INITIALIZED",
  UPDATE_GLOBAL_USED_IN_FAILED = "UPDATE_GLOBAL_USED_IN_FAILED",
}
export class InstallError extends StackitError {
  override code = "INSTALL_ERROR";
  constructor(
    public readonly type: InstallErrorType,
    message: string = "Error installing dependency",
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "InstallError";
  }

}

export enum RemoveErrorType {
  STATE_NOT_INITIALIZED = "STATE_NOT_INITIALIZED",
  DEPENDENCY_NOT_INSTALLED = "DEPENDENCY_NOT_INSTALLED",
  REMOVE_FAILED = "REMOVE_FAILED",
  UPDATE_STATE_FAILED = "UPDATE_STATE_FAILED",
  UPDATE_GLOBAL_USED_IN_FAILED = "UPDATE_GLOBAL_USED_IN_FAILED",
}

export class RemoveError extends StackitError {
  override code = "REMOVE_ERROR";

  constructor(
    public readonly type: RemoveErrorType,
    message: string = "Error removing dependency",
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = "RemoveError";
  }
}