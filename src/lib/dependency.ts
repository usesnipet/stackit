import path from "node:path";
import { mkdir } from "node:fs/promises";
import { pathExists } from "./config.js";
import { run, runGit } from "./git.js";
import { log } from "./logger.js";

export function repoUrlToFolderName(repoUrl: string): string {
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

function classifyRef(ref: string): "commit" | "tag_or_branch" {
  if (/^[0-9a-f]{7,40}$/i.test(ref)) return "commit";
  return "tag_or_branch";
}

export async function ensureDependency(
  vendorDir: string,
  repoUrl: string,
  ref: string,
): Promise<void> {
  const folderName = repoUrlToFolderName(repoUrl);
  const repoDir = path.join(vendorDir, folderName);
  const gitDir = path.join(repoDir, ".git");

  if (!(await pathExists(gitDir))) {
    log("info", `Cloning into ${repoDir}...`);
    await mkdir(vendorDir, { recursive: true });
    await runGit(vendorDir, ["clone", "--no-checkout", repoUrl, folderName]);
    log("info", "Clone complete.");
  } else {
    log("info", `Using existing repo at ${repoDir}`);
  }

  log("info", "Fetching updates...");
  await runGit(repoDir, ["fetch", "--tags", "--prune", "origin"]);
  log("info", "Fetch complete.");

  if (classifyRef(ref) === "commit") {
    log("info", `Checking out commit ${ref} (detached HEAD)...`);
    await runGit(repoDir, ["checkout", "--detach", ref]);
    log("info", "Checkout complete.");
    return;
  }

  const tagCheck = await run("git", ["rev-parse", "--verify", `refs/tags/${ref}`], repoDir);
  if (tagCheck.exitCode === 0) {
    log("info", `Checking out tag ${ref} (detached HEAD)...`);
    await runGit(repoDir, ["checkout", "--detach", `tags/${ref}`]);
    log("info", "Checkout complete.");
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
    log("info", `Creating local branch ${ref} tracking ${remoteBranch}...`);
    await runGit(repoDir, ["checkout", "-b", ref, "--track", remoteBranch]);
  } else {
    log("info", `Checking out branch ${ref}...`);
    await runGit(repoDir, ["checkout", ref]);
  }
  log("info", `Resetting branch ${ref} to ${remoteBranch}...`);
  await runGit(repoDir, ["reset", "--hard", remoteBranch]);
  log("info", "Update complete.");
}

