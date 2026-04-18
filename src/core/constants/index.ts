import os from 'os';
import { join } from "path";

export const PROJECT_JSON_NAME = "stackit.json";
export const PROJECT_JSON_PATH = (projectDir: string) => join(projectDir, PROJECT_JSON_NAME);

export const GLOBAL_DEPENDENCIES_DIRECTORY = join(os.homedir(), ".stackit");
export const GLOBAL_DEPENDENCIES_JSON_NAME = ".stackit-dependencies.json";
export const GLOBAL_DEPENDENCIES_JSON_PATH = join(GLOBAL_DEPENDENCIES_DIRECTORY, GLOBAL_DEPENDENCIES_JSON_NAME);
