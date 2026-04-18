import { describe, expect, it } from "vitest";
import { parseSemverTag, resolveReleaseTag } from "./resolve-release-tag.js";

describe("parseSemverTag", () => {
  it("parses plain and v-prefixed tags", () => {
    expect(parseSemverTag("1.2.3")).toEqual([1, 2, 3]);
    expect(parseSemverTag("v10.0.1")).toEqual([10, 0, 1]);
  });

  it("returns null for non-semver", () => {
    expect(parseSemverTag("latest")).toBeNull();
    expect(parseSemverTag("1.2")).toBeNull();
  });
});

describe("resolveReleaseTag", () => {
  it("uses explicit tag", () => {
    const r = resolveReleaseTag({ explicitTag: "2.0.0", bump: undefined, existingTags: [] });
    expect(r.isOk() && r.value).toBe("2.0.0");
  });

  it("bumps patch from latest semver among tags", () => {
    const r = resolveReleaseTag({ bump: "patch", existingTags: ["0.1.0", "v0.2.0", "noise"] });
    expect(r.isOk() && r.value).toBe("0.2.1");
  });

  it("starts at 0.0.1 for patch when no semver tags", () => {
    const r = resolveReleaseTag({ bump: "patch", existingTags: ["nope"] });
    expect(r.isOk() && r.value).toBe("0.0.1");
  });

  it("errors when both tag and bump", () => {
    const r = resolveReleaseTag({ explicitTag: "1.0.0", bump: "minor", existingTags: [] });
    expect(r.isErr()).toBe(true);
  });
});
