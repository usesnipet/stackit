#!/usr/bin/env node
import {
  main
} from "../chunk-2Q7D6T64.js";

// src/bin/stackit.ts
import { pathToFileURL } from "url";
async function run() {
  try {
    await main(process.argv);
  } catch (err) {
    console.error(String(err?.message || err));
    process.exitCode = 1;
  }
}
var invokedAsScript = import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) run();
//# sourceMappingURL=stackit.js.map