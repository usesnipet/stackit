import { Command } from "commander";
import { render } from "ink";
import React, { useCallback, useEffect, useState } from "react";
import { Text, Box, useApp } from "ink";
import { StackitService } from "../core/services/stackit/index.js";
import { Input } from "../components/input.js";
import { logo, version } from "../utils/index.js";

type InstallStep = "url" | "branch" | "tag" | "pending" | "success" | "error";

type InstallComponentDeps = {
  stackitService: StackitService;
  interactive: boolean;
  /** Pre-filled from CLI when non-interactive or first step when interactive */
  urlArg: string;
  branchArg: string;
  tagArg: string;
};

export function InstallComponent(deps: InstallComponentDeps) {
  const { exit } = useApp();
  const { stackitService, interactive, urlArg, branchArg, tagArg } = deps;

  const initialStep = (): InstallStep => {
    if (!interactive) return "pending";
    if (!urlArg.trim()) return "url";
    return "branch";
  };

  const [state, setState] = useState<{
    step: InstallStep;
    error?: string;
    url: string;
    branch: string;
    tag: string;
  }>({
    step: initialStep(),
    url: urlArg.trim(),
    branch: branchArg.trim(),
    tag: tagArg.trim(),
  });

  const runInstall = useCallback(
    async (url: string, branch: string, tag: string) => {
      setState((s) => ({ ...s, step: "pending", error: undefined }));
      const b = branch.trim() || undefined;
      const t = tag.trim() || undefined;
      const result = await stackitService.install(url, b, t);
      if (result.isErr()) {
        setState((s) => ({ ...s, step: "error", error: result.error.message }));
        return;
      }
      setState((s) => ({ ...s, step: "success" }));
    },
    [stackitService],
  );

  useEffect(() => {
    if (!interactive) {
      void runInstall(urlArg.trim(), branchArg, tagArg);
    }
  }, [interactive, urlArg, branchArg, tagArg, runInstall]);

  useEffect(() => {
    if (state.step === "success" || state.step === "error") exit();
  }, [state.step, exit]);

  const onUrlSubmit = (value: string) => {
    const u = value.trim();
    if (!u) {
      setState((s) => ({ ...s, error: "Git URL is required" }));
      return;
    }
    setState((s) => ({ ...s, url: u, branch: "", tag: "", error: undefined, step: "branch" }));
  };

  const onBranchSubmit = (value: string) => {
    const b = value.trim();
    if (b) {
      void runInstall(state.url, b, "");
      return;
    }
    setState((s) => ({ ...s, branch: "", error: undefined, step: "tag" }));
  };

  const onTagSubmit = (value: string) => {
    const t = value.trim();
    if (!t) {
      setState((s) => ({ ...s, error: "Provide a branch or a tag" }));
      return;
    }
    void runInstall(state.url, "", t);
  };

  return (
    <Box flexDirection="column">
      <Text>{logo}</Text>
      <Text dimColor>v{version}</Text>
      {state.step === "pending" && <Text color="yellow">Installing dependency...</Text>}
      {state.step === "success" && <Text color="greenBright">Dependency installed successfully.</Text>}
      {state.step === "error" && <Text color="red">Error: {state.error}</Text>}
      {state.step === "url" && (
        <Box flexDirection="column">
          {state.error ? <Text color="red">{state.error}</Text> : null}
          <Input
            label="Git repository URL"
            initialValue={state.url}
            placeholder="https://github.com/org/repo.git"
            onSubmit={onUrlSubmit}
          />
        </Box>
      )}
      {state.step === "branch" && (
        <Box flexDirection="column">
          <Text dimColor>{state.url}</Text>
          <Input
            label="Branch (leave empty to install by tag instead)"
            initialValue={state.branch}
            placeholder="main"
            onSubmit={onBranchSubmit}
          />
        </Box>
      )}
      {state.step === "tag" && (
        <Box flexDirection="column">
          <Text dimColor>{state.url}</Text>
          {state.error ? <Text color="red">{state.error}</Text> : null}
          <Input
            label="Tag"
            initialValue={state.tag}
            placeholder="v1.0.0"
            onSubmit={onTagSubmit}
          />
        </Box>
      )}
    </Box>
  );
}

type InstallCommandDeps = {
  program: Command;
  stackitService: StackitService;
};

export function createInstallCommand(deps: InstallCommandDeps) {
  const { program, stackitService } = deps;

  program
    .command("install")
    .description("Install a git dependency into the project")
    .argument("[url]", "Git repository URL of the dependency")
    .option("--branch <branch>", "Install from this branch")
    .option("--tag <tag>", "Install from this tag")
    .option("-i, --interactive", "Prompt for URL, branch or tag")
    .action(async (url: string | undefined, options: { branch?: string; tag?: string; interactive?: boolean }) => {
      const branch = options.branch ?? "";
      const tag = options.tag ?? "";
      const interactive = Boolean(options.interactive);

      if (branch && tag) {
        // eslint-disable-next-line no-console
        console.error("Provide either --branch or --tag, not both.");
        process.exitCode = 1;
        return;
      }

      if (!interactive) {
        const u = (url ?? "").trim();
        if (!u) {
          // eslint-disable-next-line no-console
          console.error("Git URL is required (argument) unless you use --interactive.");
          process.exitCode = 1;
          return;
        }
        if (!branch.trim() && !tag.trim()) {
          // eslint-disable-next-line no-console
          console.error("Provide --branch or --tag (or use --interactive).");
          process.exitCode = 1;
          return;
        }
      }

      render(
        <InstallComponent
          stackitService={stackitService}
          interactive={interactive}
          urlArg={url ?? ""}
          branchArg={branch}
          tagArg={tag}
        />,
      );
    });
}
