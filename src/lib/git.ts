import { spawn } from "node:child_process";
import { logCommand } from "./logger.js";

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export function run(cmd: string, args: string[], cwd: string): Promise<RunResult> {
  logCommand(cwd, cmd, args);
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += String(d)));
    child.stderr.on("data", (d) => (stderr += String(d)));
    child.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 0 }));
  });
}

export async function runGit(cwd: string, args: string[]): Promise<string> {
  const { exitCode, stdout, stderr } = await run("git", args, cwd);
  if (exitCode !== 0) {
    const msg = [`git ${args.join(" ")} failed (exit ${exitCode})`, stderr.trim() || stdout.trim()]
      .filter(Boolean)
      .join("\n");
    throw new Error(msg);
  }
  return stdout.trim();
}

