import { readFileSync } from "node:fs";

function readPackageVersion(): string {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const raw = readFileSync(pkgUrl, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      const v = (parsed as Record<string, unknown>)["version"];
      if (typeof v === "string" && v.trim()) return v;
    }
  } catch {
    // ignore
  }
  return "0.0.0";
}

export const version = readPackageVersion();
