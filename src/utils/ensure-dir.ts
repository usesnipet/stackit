import { mkdir, stat } from "fs/promises";

export const existsDir = async (path: string) => {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export const ensureDir = async (path: string) => {
  if (await existsDir(path)) return;
  await mkdir(path, { recursive: true });
}