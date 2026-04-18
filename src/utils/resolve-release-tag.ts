import { Result, err, ok } from "neverthrow";

export type SemverBump = "major" | "minor" | "patch";

/**
 * Parses a semver tag like `1.2.3` or `v1.2.3`.
 * @param tag - Tag string
 * @returns Tuple `[major, minor, patch]` or null if not semver
 */
export function parseSemverTag(tag: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function maxSemver(tags: [number, number, number][]): [number, number, number] {
  return tags.reduce((best, cur) => (compareSemver(cur, best) > 0 ? cur : best));
}

function bumpSemver(current: [number, number, number], bump: SemverBump): string {
  const [maj, min, pat] = current;
  if (bump === "major") return `${maj + 1}.0.0`;
  if (bump === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

export type ResolveReleaseTagInput = {
  explicitTag?: string | undefined;
  bump?: SemverBump | undefined;
  existingTags: readonly string[];
};

/**
 * Resolves the release tag from CLI flags and existing git tags.
 * @param input - Explicit tag and/or semver bump plus tag names from the repo
 * @returns Ok(tag) or Err(human-readable message)
 */
export function resolveReleaseTag(input: ResolveReleaseTagInput): Result<string, string> {
  const hasExplicit = Boolean(input.explicitTag?.trim());
  if (hasExplicit && input.bump) {
    return err("Use either --tag or exactly one of --major, --minor, --patch, not both.");
  }
  if (hasExplicit) {
    return ok(input.explicitTag!.trim());
  }
  if (!input.bump) {
    return err("Provide --tag or exactly one of --major, --minor, --patch.");
  }
  const tuples = input.existingTags.map(parseSemverTag).filter((t): t is [number, number, number] => t !== null);
  const base: [number, number, number] = tuples.length > 0 ? maxSemver(tuples) : [0, 0, 0];
  return ok(bumpSemver(base, input.bump));
}
