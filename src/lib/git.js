import { spawn } from "node:child_process";

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<{ stdout: string; stderr: string; exitCode: number }>}
 */
export function run(cmd, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += String(d)));
    child.stderr.on("data", (d) => (stderr += String(d)));
    child.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 0 }));
  });
}

/**
 * @param {string} cwd
 * @param {string[]} args
 */
export async function runGit(cwd, args) {
  const { exitCode, stdout, stderr } = await run("git", args, cwd);
  if (exitCode !== 0) {
    const msg = [
      `git ${args.join(" ")} failed (exit ${exitCode})`,
      stderr.trim() || stdout.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    throw new Error(msg);
  }
  return stdout.trim();
}

