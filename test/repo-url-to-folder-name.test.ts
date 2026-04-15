import { describe, expect, it } from "vitest";
import { repoUrlToFolderName } from "../src/index.js";

describe("repoUrlToFolderName", () => {
  it("converts https github urls", () => {
    expect(repoUrlToFolderName("https://github.com/user/repo.git")).toBe("user-repo");
  });

  it("converts ssh github urls", () => {
    expect(repoUrlToFolderName("git@github.com:user/repo.git")).toBe("user-repo");
  });

  it("falls back for unknown formats", () => {
    expect(repoUrlToFolderName("file:///tmp/some repo")).toBe("file-tmp-some-repo");
  });
});

