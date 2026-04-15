import { readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

export const CONFIG_FILENAME = "stackit.json";

export type StackitConfig = {
  dir: string;
  dependencies: Record<string, string>;
};

export async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function readConfig(cwd: string): Promise<StackitConfig> {
  const p = path.join(cwd, CONFIG_FILENAME);
  const raw = await readFile(p, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: expected an object`);
  }

  const maybe = parsed as Partial<StackitConfig> & { dependencies?: unknown };

  if (typeof maybe.dir !== "string" || !maybe.dir.trim()) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: "dir" must be a non-empty string`);
  }
  if (!maybe.dependencies || typeof maybe.dependencies !== "object") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: "dependencies" must be an object`);
  }

  for (const [k, v] of Object.entries(maybe.dependencies as Record<string, unknown>)) {
    if (typeof k !== "string" || typeof v !== "string") {
      throw new Error(
        `Invalid ${CONFIG_FILENAME}: dependencies must be { [repoUrl: string]: ref: string }`,
      );
    }
  }

  return { dir: maybe.dir, dependencies: maybe.dependencies as Record<string, string> };
}

export async function writeConfig(cwd: string, config: StackitConfig): Promise<void> {
  const p = path.join(cwd, CONFIG_FILENAME);
  const content = JSON.stringify(config, null, 2) + "\n";
  await writeFile(p, content, "utf8");
}

