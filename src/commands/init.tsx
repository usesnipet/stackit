import { Command } from "commander";
import { StackitService } from "../core/services/stackit/index.js";
import { render } from "ink";
import React, { useCallback, useEffect, useState } from "react";
import { Text, Box, useApp } from "ink";
import { version, logo } from "../utils/index.js";
import { Input } from "../components/input.js";

type InitComponentDeps = {
  stackitService: StackitService;
  directory: string;
  interactive: boolean;
}

export function InitComponent(deps: InitComponentDeps) {
  const { exit } = useApp();
  const { stackitService, directory, interactive } = deps;
  const [state, setState] = useState<{
    status: "pending" | "success" | "error" | "interactive";
    error?: string;
  }>({ status: interactive ? "interactive" : "pending" });

  const init = useCallback(async (value: string) => {
    setState({ status: "pending" });
    const initResult = await stackitService.init(value, true);
    if (initResult.isErr()) {
      setState({ status: "error", error: initResult.error.message });
      return;
    }
    setState({ status: "success" });
  }, [stackitService]);

  useEffect(() => {
    if (!interactive) init(directory);
  }, [directory, interactive, init]);

  useEffect(() => {
    if (state.status === "success" || state.status === "error") exit();
  }, [state.status, exit]);

  return (
    <Box flexDirection="column">
      <Text>{logo}</Text>
      <Text dimColor>v{version}</Text>
      {state.status === "pending" && (
        <Text color="yellow">Initializing project...</Text>
      )}
      {state.status === "success" && (
        <Text color="greenBright">Project initialized successfully!</Text>
      )}
      {state.status === "error" && (
        <Text color="red">Error initializing: {state.error}</Text>
      )}
      {state.status === "interactive" && (
        <Input
          label="Dependencies directory"
          initialValue={directory}
          placeholder="Directory to store dependencies"
          onSubmit={init}
        />
      )}
    </Box>
  );
}

type InitCommandDeps = {
  program: Command;
  stackitService: StackitService;
}
export function createInitCommand(deps: InitCommandDeps) {
  const { program, stackitService } = deps;

  program.command("init")
    .description("Initialize a new stackit project")
    .option("--interactive, -i", "Interactively ask for the dependencies directory")
    .option("--directory, -d <directory>", "The dependencies directory")
    .action(async (options: { interactive: boolean, directory: string }) => {
      render(<InitComponent
        stackitService={stackitService}
        interactive={options.interactive}
        directory={options.directory}
      />);
    });
}