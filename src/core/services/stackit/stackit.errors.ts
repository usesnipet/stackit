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
  DEPENDENCY_ALREADY_INSTALLED = "DEPENDENCY_ALREADY_INSTALLED",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  CLONE_DEPENDENCY_ERROR = "CLONE_DEPENDENCY_ERROR",
  STATE_NOT_INITIALIZED = "STATE_NOT_INITIALIZED",
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