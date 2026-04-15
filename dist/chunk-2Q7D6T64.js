#!/usr/bin/env node

// src/index.ts
import { Command } from "commander";
import { readFileSync } from "fs";

// src/commands/init.ts
import path2 from "path";

// src/lib/config.ts
import { readFile, writeFile, stat } from "fs/promises";
import path from "path";
var CONFIG_FILENAME = "stackit.json";
async function pathExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
async function readConfig(cwd) {
  const p = path.join(cwd, CONFIG_FILENAME);
  const raw = await readFile(p, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: expected an object`);
  }
  const maybe = parsed;
  if (typeof maybe.dir !== "string" || !maybe.dir.trim()) {
    throw new Error(`Invalid ${CONFIG_FILENAME}: "dir" must be a non-empty string`);
  }
  if (!maybe.dependencies || typeof maybe.dependencies !== "object") {
    throw new Error(`Invalid ${CONFIG_FILENAME}: "dependencies" must be an object`);
  }
  for (const [k, v] of Object.entries(maybe.dependencies)) {
    if (typeof k !== "string" || typeof v !== "string") {
      throw new Error(
        `Invalid ${CONFIG_FILENAME}: dependencies must be { [repoUrl: string]: ref: string }`
      );
    }
  }
  return { dir: maybe.dir, dependencies: maybe.dependencies };
}
async function writeConfig(cwd, config) {
  const p = path.join(cwd, CONFIG_FILENAME);
  const content = JSON.stringify(config, null, 2) + "\n";
  await writeFile(p, content, "utf8");
}

// src/lib/logger.ts
function formatPrefix(level) {
  return `[stackit] [${level}]`;
}
function log(level, message) {
  const line = `${formatPrefix(level)} ${message}`;
  if (level === "error") console.error(line);
  else console.log(line);
}
function logCommand(cwd, cmd, args) {
  log("info", `$ ${cmd} ${args.join(" ")} (cwd: ${cwd})`);
}

// src/commands/init.ts
function registerInitCommand(program) {
  program.command("init").description("Create a stackit.json template in the current directory").action(async () => {
    const cwd = process.cwd();
    const p = path2.join(cwd, CONFIG_FILENAME);
    if (await pathExists(p)) {
      throw new Error(`${CONFIG_FILENAME} already exists`);
    }
    log("info", `Creating ${CONFIG_FILENAME}...`);
    await writeConfig(cwd, { dir: "vendor", dependencies: {} });
    log("info", `Created ${p}`);
  });
}

// src/commands/install.ts
import path4 from "path";

// src/lib/dependency.ts
import path3 from "path";
import { mkdir } from "fs/promises";

// src/lib/git.ts
import { spawn } from "child_process";
function run(cmd, args, cwd) {
  logCommand(cwd, cmd, args);
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => stdout += String(d));
    child.stderr.on("data", (d) => stderr += String(d));
    child.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 0 }));
  });
}
async function runGit(cwd, args) {
  const { exitCode, stdout, stderr } = await run("git", args, cwd);
  if (exitCode !== 0) {
    const msg = [`git ${args.join(" ")} failed (exit ${exitCode})`, stderr.trim() || stdout.trim()].filter(Boolean).join("\n");
    throw new Error(msg);
  }
  return stdout.trim();
}

// src/lib/dependency.ts
function repoUrlToFolderName(repoUrl) {
  const withoutGit = repoUrl.replace(/\.git$/i, "");
  const m = withoutGit.match(/[:/](?<owner>[^/:\s]+)\/(?<repo>[^/:\s]+)$/);
  if (!m?.groups?.owner || !m?.groups?.repo) {
    return repoUrl.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  }
  return `${m.groups.owner}-${m.groups.repo}`.toLowerCase();
}
function classifyRef(ref) {
  if (/^[0-9a-f]{7,40}$/i.test(ref)) return "commit";
  return "tag_or_branch";
}
async function ensureDependency(vendorDir, repoUrl, ref) {
  const folderName = repoUrlToFolderName(repoUrl);
  const repoDir = path3.join(vendorDir, folderName);
  const gitDir = path3.join(repoDir, ".git");
  if (!await pathExists(gitDir)) {
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
    repoDir
  );
  if (remoteCheck.exitCode !== 0) {
    throw new Error(`Ref "${ref}" not found as tag or remote branch in ${repoUrl}`);
  }
  const localBranchCheck = await run(
    "git",
    ["show-ref", "--verify", "--quiet", `refs/heads/${ref}`],
    repoDir
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

// src/commands/install.ts
function registerInstallCommand(program) {
  program.command("install").description("Install dependencies defined in stackit.json").action(async () => {
    const cwd = process.cwd();
    const config = await readConfig(cwd);
    const vendorDir = path4.join(cwd, config.dir);
    const entries = Object.entries(config.dependencies);
    log("info", `Installing ${entries.length} dependenc${entries.length === 1 ? "y" : "ies"}...`);
    log("info", `Target directory: ${vendorDir}`);
    for (const [repoUrl, ref] of entries) {
      log("info", `Installing ${repoUrl} @ ${ref}`);
      await ensureDependency(vendorDir, repoUrl, ref);
      log("info", `Done: ${repoUrl}`);
    }
    log("info", "Install complete.");
  });
}

// src/commands/update.ts
import path5 from "path";
function registerUpdateCommand(program) {
  program.command("update").description("Fetch and re-checkout dependencies (alias of install)").action(async () => {
    const cwd = process.cwd();
    const config = await readConfig(cwd);
    const vendorDir = path5.join(cwd, config.dir);
    const entries = Object.entries(config.dependencies);
    log("info", `Updating ${entries.length} dependenc${entries.length === 1 ? "y" : "ies"}...`);
    log("info", `Target directory: ${vendorDir}`);
    for (const [repoUrl, ref] of entries) {
      log("info", `Updating ${repoUrl} @ ${ref}`);
      await ensureDependency(vendorDir, repoUrl, ref);
      log("info", `Done: ${repoUrl}`);
    }
    log("info", "Update complete.");
  });
}

// src/commands/add.ts
import path6 from "path";
function registerAddCommand(program) {
  program.command("add").description("Add a dependency to stackit.json").argument("<repoUrl>", "Git repository URL (ssh or https)").requiredOption("--ref <ref>", "Branch, tag, or commit").action(async (repoUrl, opts) => {
    const cwd = process.cwd();
    const config = await readConfig(cwd);
    const existed = Object.prototype.hasOwnProperty.call(config.dependencies, repoUrl);
    config.dependencies[repoUrl] = String(opts.ref);
    log("info", `${existed ? "Updating" : "Adding"} dependency: ${repoUrl} @ ${opts.ref}`);
    await writeConfig(cwd, config);
    log("info", "Saved stackit.json");
    const vendorDir = path6.join(cwd, config.dir);
    await ensureDependency(vendorDir, repoUrl, opts.ref);
    log("info", "Dependency added successfully");
  });
}

// src/commands/tag.ts
function registerTagCommand(program) {
  program.command("tag").description("Create a git tag in the current repository").argument("<tag>", "Tag name (e.g. 0.0.1)").option("--push", "Also push the tag to origin", false).action(async (tag, opts) => {
    const cwd = process.cwd();
    log("info", `Creating tag ${tag}...`);
    await runGit(cwd, ["tag", String(tag)]);
    log("info", `Created tag ${tag}.`);
    if (opts.push) {
      log("info", `Pushing tag ${tag} to origin...`);
      await runGit(cwd, ["push", "origin", String(tag)]);
      log("info", "Push complete.");
    }
  });
}

// src/index.ts
var logo = `
  ___ _____ _   ___ _  _____ _____
 / __|_   _/_\\ / __| |/ /_ _|_   _|
 \\__ \\ | |/ _ \\ (__| ' < | |  | |
 |___/ |_/_/ \\_\\___|_|\\_\\___| |_|  `;
function readPackageVersion() {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const raw = readFileSync(pkgUrl, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "version" in parsed) {
      const v = parsed.version;
      if (typeof v === "string" && v.trim()) return v;
    }
  } catch {
  }
  return "0.0.0";
}
var version = readPackageVersion();
function createProgram() {
  const program = new Command();
  program.name("stackit").description("Git-native dependency manager.").version(version);
  registerInitCommand(program);
  registerInstallCommand(program);
  registerUpdateCommand(program);
  registerAddCommand(program);
  registerTagCommand(program);
  return program;
}
async function main(argv = process.argv) {
  if (!process.env.STACKIT_NO_LOGO) {
    console.log(logo);
  }
  const program = createProgram();
  await program.parseAsync(argv);
}

export {
  repoUrlToFolderName,
  logo,
  version,
  createProgram,
  main
};
//# sourceMappingURL=chunk-2Q7D6T64.js.map