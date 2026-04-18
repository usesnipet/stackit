export enum ReadFileErrorType {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  INVALID_JSON = "INVALID_JSON",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
}

export class ReadFileError extends Error {
  code = "READ_FILE_ERROR";

  constructor(public readonly type: ReadFileErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ReadFileError";
  }
}

export enum WriteFileErrorType {
  WRITE_FAILED = "WRITE_FAILED",
  INVALID_JSON = "INVALID_JSON",
}
export class WriteFileError extends Error {
  code = "WRITE_FILE_ERROR";

  constructor(public readonly type: WriteFileErrorType, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "WriteFileError";
  }
}