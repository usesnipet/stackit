import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

export const CONFIG_FILENAME = "stackit.json";

/**
 * @typedef {Object} StackitConfig
 * @property {string} dir
 * @property {Record<string, string>} dependencies
 */

/**
 * @param {string} p
 */
export async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} cwd
 * @returns {Promise<StackitConfig>}
 */
export async function readConfig(cwd) {
  const p = path.join(cwd, CONFIG_FILENAME);
  const raw = await readFile(p, "utf8");
  /** @type {unknown} */
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: expected an object`);
  }

  // @ts-ignore - runtime validation below
  const dir = parsed.dir;
  // @ts-ignore
  const dependencies = parsed.dependencies;

  if (typeof dir !== "string" || !dir.trim()) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: "dir" must be a non-empty string`);
  }
  if (!dependencies || typeof dependencies !== "object") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: "dependencies" must be an object`);
  }
  for (const [k, v] of Object.entries(dependencies)) {
    if (typeof k !== "string" || typeof v !== "string") {
      throw new Error(
        `Invalid ${CONFIG_FILENAME}: dependencies must be { [repoUrl: string]: ref: string }`,
      );
    }
  }

  return { dir, dependencies };
}

/**
 * @param {string} cwd
 * @param {StackitConfig} config
 */
export async function writeConfig(cwd, config) {
  const p = path.join(cwd, CONFIG_FILENAME);
  const content = JSON.stringify(config, null, 2) + "\n";
  await writeFile(p, content, "utf8");
}

