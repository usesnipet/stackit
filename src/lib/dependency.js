import path from "node:path";
import { mkdir } from "node:fs/promises";
import { pathExists } from "./config.js";
import { run, runGit } from "./git.js";

/**
 * Turns a repo URL into a stable folder name.
 * Example: https://github.com/user/repo.git -> user-repo
 * @param {string} repoUrl
 */
export function repoUrlToFolderName(repoUrl) {
  const withoutGit = repoUrl.replace(/\.git$/i, "");
  const m = withoutGit.match(/[:/](?<owner>[^/:\s]+)\/(?<repo>[^/:\s]+)$/);
  if (!m?.groups?.owner || !m?.groups?.repo) {
    return repoUrl
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }
  return `${m.groups.owner}-${m.groups.repo}`.toLowerCase();
}

/**
 * @param {string} ref
 * @returns {"commit" | "tag_or_branch"}
 */
function classifyRef(ref) {
  if (/^[0-9a-f]{7,40}$/i.test(ref)) return "commit";
  return "tag_or_branch";
}

/**
 * Ensure repo exists and is checked out deterministically.
 * - for commits: detached head at sha
 * - for tags: detached head at tag
 * - for branches: hard-reset to origin/<branch>
 *
 * @param {string} vendorDir
 * @param {string} repoUrl
 * @param {string} ref
 */
export async function ensureDependency(vendorDir, repoUrl, ref) {
  const folderName = repoUrlToFolderName(repoUrl);
  const repoDir = path.join(vendorDir, folderName);
  const gitDir = path.join(repoDir, ".git");

  if (!(await pathExists(gitDir))) {
    await mkdir(vendorDir, { recursive: true });
    await runGit(vendorDir, ["clone", "--no-checkout", repoUrl, folderName]);
  }

  await runGit(repoDir, ["fetch", "--tags", "--prune", "origin"]);

  if (classifyRef(ref) === "commit") {
    await runGit(repoDir, ["checkout", "--detach", ref]);
    return;
  }

  const tagCheck = await run("git", ["rev-parse", "--verify", `refs/tags/${ref}`], repoDir);
  if (tagCheck.exitCode === 0) {
    await runGit(repoDir, ["checkout", "--detach", `tags/${ref}`]);
    return;
  }

  const remoteBranch = `origin/${ref}`;
  const remoteCheck = await run(
    "git",
    ["show-ref", "--verify", "--quiet", `refs/remotes/${remoteBranch}`],
    repoDir,
  );
  if (remoteCheck.exitCode !== 0) {
    throw new Error(`Ref "${ref}" not found as tag or remote branch in ${repoUrl}`);
  }

  const localBranchCheck = await run(
    "git",
    ["show-ref", "--verify", "--quiet", `refs/heads/${ref}`],
    repoDir,
  );
  if (localBranchCheck.exitCode !== 0) {
    await runGit(repoDir, ["checkout", "-b", ref, "--track", remoteBranch]);
  } else {
    await runGit(repoDir, ["checkout", ref]);
  }
  await runGit(repoDir, ["reset", "--hard", remoteBranch]);
}

