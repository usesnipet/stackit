export type LogLevel = "info" | "warn" | "error";

function formatPrefix(level: LogLevel): string {
  return `[stackit] [${level}]`;
}

export function log(level: LogLevel, message: string): void {
  const line = `${formatPrefix(level)} ${message}`;
  if (level === "error") console.error(line);
  else console.log(line);
}

export function logCommand(cwd: string, cmd: string, args: string[]): void {
  log("info", `$ ${cmd} ${args.join(" ")} (cwd: ${cwd})`);
}

