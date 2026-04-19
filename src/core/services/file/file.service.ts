import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "node:path";
import { Result, err, ok } from "neverthrow";
import z from "zod";
import { ReadFileError, ReadFileErrorType, WriteFileError, WriteFileErrorType } from "./file.errors.js";

export type FileService = ReturnType<typeof createFileService>;

export const createFileService = () => {
  return {
    readJsonFile: async <T>(
      path: string,
      schema?: z.ZodSchema<T>,
    ): Promise<Result<T, ReadFileError>> => {
      try {
        const content = await readFile(path, { encoding: "utf8" });
        const parsed = JSON.parse(content) as T;
        if (schema) {
          const result = schema.safeParse(parsed);
          if (!result.success) {
            return err(
              new ReadFileError(
                ReadFileErrorType.INVALID_JSON,
                `Invalid JSON file: ${path}`,
                result.error,
              ),
            );
          }
          return ok(result.data);
        }
        return ok(parsed);
      } catch (error: unknown) {
        const code =
          error &&
          typeof error === "object" &&
          "code" in error &&
          typeof (error as { code: unknown }).code === "string"
            ? (error as { code: string }).code
            : undefined;
        if (code === "ENOENT" || code === "ENOTDIR") {
          return err(
            new ReadFileError(
              ReadFileErrorType.FILE_NOT_FOUND,
              `File not found: ${path}`,
              error,
            ),
          );
        }
        // All other read/parse errors
        return err(
          new ReadFileError(
            ReadFileErrorType.UNEXPECTED_ERROR,
            `Unexpected error reading JSON file: ${path}`,
            error,
          ),
        );
      }
    },

    writeJsonFile: async <T>(
      path: string,
      content: T,
      schema?: z.ZodSchema<T>,
    ): Promise<Result<T, WriteFileError>> => {
      if (schema) {
        const result = schema.safeParse(content);
        if (!result.success) {
          return err(
            new WriteFileError(WriteFileErrorType.INVALID_JSON, `Invalid JSON file: ${path}`, result.error),
          );
        }
      }
      try {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, JSON.stringify(content, null, 2));
      } catch (error) {
        return err(
          new WriteFileError(WriteFileErrorType.WRITE_FAILED, `Failed to write JSON file: ${path}`, error),
        );
      }
      return ok(content);
    },
  }
}